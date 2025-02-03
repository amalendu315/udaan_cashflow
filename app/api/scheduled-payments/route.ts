import sql from "mssql";
import { NextResponse } from "next/server";
import { connectDb } from "@/db/config";

// Type Definitions
interface ScheduledPayment {
  id?: number;
  date: string;
  ledger_id: number;
  hotel_id: number;
  total_amount: number;
  payment_term: "monthly" | "quarterly" | "half yearly" | "full payment";
  end_date: string;
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
        sp.total_amount,
        sp.EMI,
        sp.payment_term,
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
export async function POST(req: Request) {
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

    const query = `
      INSERT INTO scheduled_payments (date, ledger_id, hotel_id, total_amount, EMI, payment_term, end_date)
      VALUES (@date, @ledger_id, @hotel_id, @total_amount, @emi, @payment_term, @end_date);
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
    // Calculate total months and EMI
    const totalMonths = calculateTotalMonths(payload.date, payload.end_date);
    const emi = calculateEMI(
      payload.total_amount,
      payload.payment_term,
      totalMonths
    );

    const query = `
      UPDATE scheduled_payments
      SET date = @date,
          ledger_id = @ledger_id,
          hotel_id = @hotel_id,
          total_amount = @total_amount,
          EMI = @emi,
          payment_term = @payment_term,
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
