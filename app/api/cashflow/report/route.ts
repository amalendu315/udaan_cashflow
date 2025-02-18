import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/db/config";
import sql from "mssql";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");

    if (!month) {
      return NextResponse.json(
        { message: "Month parameter is required." },
        { status: 400 }
      );
    }

    const [year, monthNumber] = month.split("-").map(Number);
    const startDate = `${year}-${monthNumber.toString().padStart(2, "0")}-01`;
    const endDate = new Date(year, monthNumber, 0).toISOString().split("T")[0];

    const pool = await connectDb();

    // 🟢 Get Opening Balance
    const openingBalanceQuery = `
      SELECT closing FROM cashflow 
      WHERE date = DATEADD(DAY, -1, @startDate)
    `;
    const openingResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .query(openingBalanceQuery);
    const openingBalance = openingResult.recordset[0]?.closing || 0;

    // 🟢 Get Cash In-Flow
    const inflowQuery = `
      SELECT l.name AS ledger_name, SUM(pil.amount) AS total_amount
      FROM projected_inflow pi
      JOIN projected_inflow_ledgers pil ON pi.id = pil.projected_inflow_id
      JOIN ledgers l ON pil.ledger_id = l.id
      WHERE pi.date BETWEEN @startDate AND @endDate
      GROUP BY l.name
    `;
    const inflowResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .query(inflowQuery);
    const inflows = inflowResult.recordset;

    // 🟢 Get Cash Out-Flow
    const expensesQuery = `
      SELECT pg.name AS payment_group, SUM(pr.amount) AS total_amount
      FROM payment_requests pr
      JOIN payment_groups pg ON pr.payment_group_id = pg.id
      WHERE pr.date BETWEEN @startDate AND @endDate
      GROUP BY pg.name
    `;
    const expensesResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .query(expensesQuery);
    const expenses = expensesResult.recordset;

    // 🟢 Get Scheduled & Monthly Payments
    const scheduledPaymentsQuery = `
      SELECT SUM(sp.EMI) AS total_amount
      FROM scheduled_payments sp
      WHERE sp.date BETWEEN @startDate AND @endDate
    `;
    const scheduledResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .query(scheduledPaymentsQuery);
    const scheduledPayments = scheduledResult.recordset[0]?.total_amount || 0;

    const monthlyPaymentsQuery = `
      SELECT SUM(mp.amount) AS total_amount
      FROM monthly_payments mp
      WHERE 
        DATEFROMPARTS(YEAR(@startDate), MONTH(@startDate), mp.day_of_month) >= @startDate
        AND DATEFROMPARTS(YEAR(@endDate), MONTH(@endDate), mp.day_of_month) <= @endDate
    `;
    const monthlyResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .query(monthlyPaymentsQuery);
    const monthlyPayments = monthlyResult.recordset[0]?.total_amount || 0;

    const otherPayments = scheduledPayments + monthlyPayments;

    // 🟢 Calculate Net Cash in Hand
    const totalCashInflow = inflows.reduce(
      (sum, item) => sum + item.total_amount,
      0
    );
    const totalExpenses =
      expenses.reduce((sum, item) => sum + item.total_amount, 0) +
      otherPayments;
    const netCashInHand = openingBalance + totalCashInflow - totalExpenses;

    return NextResponse.json({
      month,
      openingBalance,
      totalCashInflow,
      totalExpenses,
      netCashInHand,
      inflows,
      expenses,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching report data", error },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { month, cashBalance, bankBalance } = await req.json();
    if (!month || cashBalance === undefined || bankBalance === undefined) {
      return NextResponse.json(
        { message: "All inputs are required." },
        { status: 400 }
      );
    }

    const [year, monthNumber] = month.split("-").map(Number);
    const startDate = `${year}-${monthNumber.toString().padStart(2, "0")}-01`;
    const endDate = new Date(year, monthNumber, 0).toISOString().split("T")[0];

    const pool = await connectDb();

    // 🟢 Get Opening Balance (Previous Month Closing)
    const openingBalanceQuery = `
      SELECT closing FROM cashflow 
      WHERE date = DATEADD(DAY, -1, @startDate)
    `;
    const openingResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .query(openingBalanceQuery);
    const openingBalance = openingResult.recordset[0]?.closing || 0;

    // 🟢 Get Cash In-Flow (Include all Ledgers, even if amount is 0)
    const inflowQuery = `
      SELECT l.name AS ledger_name, COALESCE(SUM(pil.amount), 0) AS total_amount
      FROM ledgers l
      LEFT JOIN projected_inflow_ledgers pil ON l.id = pil.ledger_id
      LEFT JOIN projected_inflow pi ON pil.projected_inflow_id = pi.id
      AND pi.date BETWEEN @startDate AND @endDate
      GROUP BY l.name
    `;
    const inflowResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .query(inflowQuery);
    const inflows = inflowResult.recordset;

    // 🟢 Get Cash Out-Flow (Include all Payment Groups, even if amount is 0)
    const expensesQuery = `
      SELECT pg.name AS payment_group, COALESCE(SUM(pr.amount), 0) AS total_amount
      FROM payment_groups pg
      LEFT JOIN payment_requests pr ON pg.id = pr.payment_group_id
      AND pr.date BETWEEN @startDate AND @endDate
      GROUP BY pg.name
    `;
    const expensesResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .query(expensesQuery);
    const expenses = expensesResult.recordset;

    // 🟢 Get Scheduled & Monthly Payments
    const scheduledPaymentsQuery = `
      SELECT COALESCE(SUM(sp.EMI), 0) AS total_amount
      FROM scheduled_payments sp
      WHERE sp.date BETWEEN @startDate AND @endDate
    `;
    const scheduledResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .query(scheduledPaymentsQuery);
    const scheduledPayments = scheduledResult.recordset[0]?.total_amount || 0;

    const monthlyPaymentsQuery = `
      SELECT COALESCE(SUM(mp.amount), 0) AS total_amount
      FROM monthly_payments mp
      WHERE 
        DATEFROMPARTS(YEAR(@startDate), MONTH(@startDate), mp.day_of_month) >= @startDate
        AND DATEFROMPARTS(YEAR(@endDate), MONTH(@endDate), mp.day_of_month) <= @endDate
    `;
    const monthlyResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .query(monthlyPaymentsQuery);
    const monthlyPayments = monthlyResult.recordset[0]?.total_amount || 0;

    const otherPayments = scheduledPayments + monthlyPayments;

    // 🟢 Calculate Net Cash in Hand
    const totalCashInflow = inflows.reduce(
      (sum, item) => sum + item.total_amount,
      0
    );
    const totalExpenses =
      expenses.reduce((sum, item) => sum + item.total_amount, 0) +
      otherPayments;
    const netCashInHand =
      cashBalance + bankBalance + totalCashInflow - totalExpenses;

    // ✅ Store this in Report Context for later use
    return NextResponse.json(
      {
        month,
        cashBalance,
        bankBalance,
        openingBalance,
        totalCashInflow,
        otherPayments,
        totalExpenses,
        netCashInHand,
        inflows,
        expenses,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error generating report", error },
      { status: 500 }
    );
  }
}