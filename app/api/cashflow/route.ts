import { NextResponse } from "next/server";
import { connectDb } from "@/db/config";

interface CashflowEntry {
  date: string;
  projected_inflow: number;
  actual_inflow: number;
  total_payments: number;
  closing: number;
  projected_breakdown: { ledger_name: string; amount: number }[];
}

export async function GET() {
  const pool = await connectDb();

  try {
    // Fetch all ledger names to ensure all ledgers exist for each date
    const ledgerNamesResult = await pool.query(`SELECT id, name FROM ledgers`);
    const ledgerNames = ledgerNamesResult.recordset;

    // Fetch cashflow data with actual inflow and payments
    const cashflowQuery = `
      SELECT 
        FORMAT(c.date, 'yyyy-MM-dd') AS date,
        c.projected_inflow,
        COALESCE(ai.amount, 0) AS actual_inflow,
        c.total_payments,
        c.closing
      FROM cashflow c
      LEFT JOIN actual_inflow ai ON c.actual_inflow_id = ai.id
      WHERE FORMAT(c.date, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')
      ORDER BY c.date;
    `;

    const cashflowResult = await pool.request().query(cashflowQuery);
    const cashflowData: CashflowEntry[] = cashflowResult.recordset;

    // Fetch projected inflow breakdown per ledger for each date
    const breakdownQuery = `
      SELECT 
        pi.id AS inflow_id, 
        FORMAT(pi.date, 'yyyy-MM-dd') AS date, 
        l.name AS ledger_name, 
        ISNULL(pil.amount, 0) AS amount
      FROM 
        projected_inflow pi
      CROSS JOIN 
        (SELECT id, name FROM ledgers) l
      LEFT JOIN 
        projected_inflow_ledgers pil 
      ON 
        pil.projected_inflow_id = pi.id
        AND pil.ledger_id = l.id
      WHERE 
        FORMAT(pi.date, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM')
      ORDER BY 
        pi.date, l.id;
    `;

    const breakdownResult = await pool.request().query(breakdownQuery);
    const breakdownData = breakdownResult.recordset;

    // Merge projected inflow breakdown into cashflow data
    const cashflowWithBreakdown = cashflowData.map((entry) => ({
      ...entry,
      projected_breakdown: ledgerNames.map(({ name }) => ({
        ledger_name: name,
        amount:
          breakdownData.find(
            (b) => b.date === entry.date && b.ledger_name === name
          )?.amount || 0,
      })),
    }));

    return NextResponse.json(cashflowWithBreakdown, { status: 200 });
  } catch (error) {
    console.error("Error fetching cashflow data:", error);
    return NextResponse.json(
      { message: "Error fetching cashflow data", error },
      { status: 500 }
    );
  }
}
