import sql from "mssql";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/db/config";
import { formatCurrency } from "@/utils";
import { formatReadableDate } from "@/lib/utils";

// Type Definitions
interface ScheduledPayment {
  id?: number;
  date: string;
  ledger_id: number;
  hotel_id: number;
  total_amount: number;
  payment_term: "monthly" | "quarterly" | "half yearly" | "full payment";
  end_date: string;
  payment_status:string;
}

// Utility function to calculate EMI based on the total months
function calculateEMI(
  totalAmount: number,
  paymentTerm: "monthly" | "quarterly" | "half yearly" | "full payment",
  totalMonths: number
): number {
  const termsPerYear: Record<ScheduledPayment["payment_term"], number> = {
    monthly: 12,
    quarterly: 4,
    "half yearly": 2,
    "full payment": 1,
  };

  console.log("Total Amount:", totalAmount);
  console.log("Payment Term:", paymentTerm);
  console.log("Total Months:", totalMonths);

  if (totalMonths <= 0) {
    console.error("Error: Total months cannot be zero or negative");
    return 0;
  }

  const periods = Math.max(
    1,
    Math.ceil((totalMonths / 12) * termsPerYear[paymentTerm])
  );

  console.log("Calculated Periods:", periods);

  const emi = totalAmount / periods;
  console.log("Calculated EMI:", emi);

  return emi;
}

// Utility function to calculate total months between two dates
function calculateTotalMonths(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.error("Error: Invalid date format", { startDate, endDate });
    return 0;
  }

  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();

  const totalMonths = Math.max(1, yearDiff * 12 + monthDiff + 1); // Ensure at least 1 month

  console.log("Calculated Total Months:", totalMonths);
  return totalMonths;
}
// **GET: Fetch all scheduled payments**
export async function GET() {
  const pool = await connectDb();

  try {
    const query = `
      SELECT 
        sp.id,
        FORMAT(sp.date, 'yyyy-MM-dd') AS date,  -- Convert to YYYY-MM-DD
        l.name AS ledger_name,
        h.name AS hotel_name,
        sp.ledger_id,
        sp.hotel_id,
        sp.total_amount,
        sp.EMI,
        sp.payment_term,
        sp.payment_status,
        FORMAT(sp.end_date, 'yyyy-MM-dd') AS end_date  -- Convert to YYYY-MM-DD
      FROM 
        scheduled_payments sp
      JOIN 
        monthly_payment_ledgers l ON sp.ledger_id = l.id
      JOIN 
        hotels h ON sp.hotel_id = h.id
      ORDER BY 
        sp.date ASC;
    `;

    const result = await pool.request().query(query);
    return NextResponse.json(result.recordset, { status: 200 });
  } catch (error) {
    console.error("Error fetching scheduled payments:", error);
    return NextResponse.json(
      { message: "Error fetching scheduled payments", error: error },
      { status: 500 }
    );
  }
}

// **POST: Create a new scheduled payment**
export async function POST(req: NextRequest) {
  const pool = await connectDb();
  const payload: ScheduledPayment = await req.json();

  try {
    // ✅ Ensure total months is at least 1
    const totalMonths = calculateTotalMonths(payload.date, payload.end_date);
    if (totalMonths <= 0) {
      return NextResponse.json(
        { message: "Invalid date range for EMI calculation" },
        { status: 400 }
      );
    }

    const emi = calculateEMI(
      payload.total_amount,
      payload.payment_term,
      totalMonths
    );

    // ✅ Prevent inserting invalid EMI
    if (isNaN(emi) || emi === undefined || emi === 0) {
      return NextResponse.json(
        { message: "Invalid EMI calculation. Check input values." },
        { status: 400 }
      );
    }

    console.log("Total Months:", totalMonths);
    console.log("Final EMI Value:", emi);

    // ✅ Fetch last available closing amount
    const lastClosingQuery = `
      SELECT TOP 1 closing FROM cashflow 
      WHERE date < @date
      ORDER BY date DESC;
    `;
    const lastClosingResult = await pool
      .request()
      .input("date", sql.Date, payload.date)
      .query(lastClosingQuery);

    const lastClosing = lastClosingResult.recordset[0]?.closing || 0;

    // ✅ Fetch actual inflow for the scheduled date
    const actualInflowQuery = `
      SELECT amount FROM actual_inflow WHERE date = @date;
    `;
    const actualInflowResult = await pool
      .request()
      .input("date", sql.Date, payload.date)
      .query(actualInflowQuery);

    const actualInflow = actualInflowResult.recordset[0]?.amount || 0;

    // 🚨 **Block Payment If Actual Inflow is 0**
    if (actualInflow === 0) {

      return NextResponse.json(
        {
          message:
            `Cannot create a scheduled payment. No actual inflow recorded for this date :- ${formatReadableDate(payload.date)}`,
        },
        { status: 400 }
      );
    }

    // 🚨 **Block Payment If New EMI Exceeds Last Closing**
    if (emi > lastClosing) {

      return NextResponse.json(
        { message: `Cannot create scheduled payment. Insufficient balance :- ${formatCurrency(lastClosing)}` },
        { status: 400 }
      );
    }

    // ✅ Insert the Scheduled Payment
    const query = `
      INSERT INTO scheduled_payments (date, ledger_id, hotel_id, total_amount, EMI, payment_term, payment_status, end_date)
      VALUES (@date, @ledger_id, @hotel_id, @total_amount, @emi, @payment_term, @payment_status, @end_date);
    `;

    await pool
      .request()
      .input("date", sql.Date, payload.date)
      .input("ledger_id", sql.Int, payload.ledger_id)
      .input("hotel_id", sql.Int, payload.hotel_id)
      .input("total_amount", sql.Decimal(18, 2), payload.total_amount)
      .input("emi", sql.Decimal(18, 2), emi)
      .input("payment_term", sql.NVarChar, payload.payment_term)
      .input("end_date", sql.Date, payload.end_date)
      .input("payment_status", sql.NVarChar, payload.payment_status)
      .query(query);

    return NextResponse.json(
      { message: "Scheduled payment created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating scheduled payment:", error);
    return NextResponse.json(
      { message: "Error creating scheduled payment", error: error },
      { status: 500 }
    );
  }
}


// **PUT: Update an existing scheduled payment**
export async function PUT(req: Request) {
  const pool = await connectDb();
  const payload: ScheduledPayment = await req.json();

  if (!payload.id) {
    return NextResponse.json({ message: "ID is required" }, { status: 400 });
  }

  try {
    // ✅ Step 1: Calculate total months and EMI
    const totalMonths = calculateTotalMonths(payload.date, payload.end_date);
    const emi = calculateEMI(
      payload.total_amount,
      payload.payment_term,
      totalMonths
    );

    // ✅ Step 2: Fetch Previous Closing Balance Before Updating
    const closingBalanceQuery = `
      SELECT TOP 1 closing 
      FROM cashflow 
      WHERE date < @date 
      ORDER BY date DESC;
    `;

    const closingBalanceResult = await pool
      .request()
      .input("date", sql.Date, payload.date)
      .query(closingBalanceQuery);

    const previousClosing = closingBalanceResult.recordset[0]?.closing || 0;

    // ✅ Step 3: Check if Actual Inflow Exists on the Payment Date
    const actualInflowQuery = `
      SELECT actual_inflow FROM cashflow WHERE date = @date;
    `;

    const actualInflowResult = await pool
      .request()
      .input("date", sql.Date, payload.date)
      .query(actualInflowQuery);

    const actualInflow = actualInflowResult.recordset[0]?.actual_inflow || 0;

    // ✅ Step 4: Fetch Existing Scheduled Payment Data
    const oldPaymentQuery = `
      SELECT EMI FROM scheduled_payments WHERE id = @id;
    `;

    const oldPaymentResult = await pool
      .request()
      .input("id", sql.Int, payload.id)
      .query(oldPaymentQuery);

    const oldEMI = oldPaymentResult.recordset[0]?.EMI || 0;

    // ✅ Step 5: Validate Against Negative Closing
    const newClosing = previousClosing - emi + oldEMI; // Adjusted for the change in EMI

    if (newClosing < 0) {
      return NextResponse.json(
        {
          message: `Cannot create scheduled payment. Insufficient balance :- ${formatCurrency(
            previousClosing
          )}`,
        },
        { status: 400 }
      );
    }

    // ✅ Step 6: Prevent Update if No Actual Inflow Exists
    if (actualInflow === 0) {
      return NextResponse.json(
        {
          message: `Cannot update scheduled payment. No actual inflow recorded for this date :- ${formatReadableDate(
            payload.date
          )}`,
        },
        { status: 400 }
      );
    }

    // ✅ Step 7: Update Scheduled Payment
    const query = `
      UPDATE scheduled_payments
      SET date = @date,
          ledger_id = @ledger_id,
          hotel_id = @hotel_id,
          total_amount = @total_amount,
          EMI = @emi,
          payment_term = @payment_term,
          payment_status = @payment_status,
          end_date = @end_date,
          updated_at = GETDATE()
      WHERE id = @id;
    `;

    await pool
      .request()
      .input("id", sql.Int, payload.id)
      .input("date", sql.Date, payload.date)
      .input("ledger_id", sql.Int, payload.ledger_id)
      .input("hotel_id", sql.Int, payload.hotel_id)
      .input("total_amount", sql.Decimal(18, 2), payload.total_amount)
      .input("emi", sql.Decimal(18, 2), emi)
      .input("payment_term", sql.NVarChar, payload.payment_term)
      .input("payment_status", sql.NVarChar, payload.payment_status)
      .input("end_date", sql.Date, payload.end_date)
      .query(query);

    return NextResponse.json(
      { message: "Scheduled payment updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating scheduled payment:", error);
    return NextResponse.json(
      { message: "Error updating scheduled payment", error: error },
      { status: 500 }
    );
  }
}


// **DELETE: Delete a scheduled payment**
export async function DELETE(req: Request) {
  const pool = await connectDb();
  const { id }: { id: number } = await req.json();

  if (!id) {
    return NextResponse.json({ message: "ID is required" }, { status: 400 });
  }

  try {
    const query = `
      DELETE FROM scheduled_payments WHERE id = @id;
    `;

    await pool.request().input("id", sql.Int, id).query(query);

    return NextResponse.json(
      { message: "Scheduled payment deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting scheduled payment:", error);
    return NextResponse.json(
      { message: "Error deleting scheduled payment", error: error },
      { status: 500 }
    );
  }
}
