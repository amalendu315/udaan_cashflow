import { NextResponse } from "next/server";
import { connectDb } from "@/db/config";

interface CashflowEntry {
  date: string;
  projected_inflow: number;
  actual_inflow: number;
  total_payments: number;
  closing: number;
}

export async function GET() {
  const pool = await connectDb();

  try {
    // Fetch data directly from the `cashflow` table without extra calculations
    const query = `
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

    const result = await pool.request().query(query);
    const cashflowData: CashflowEntry[] = result.recordset;

    return NextResponse.json(cashflowData, { status: 200 });
  } catch (error) {
    console.error("Error fetching cashflow data:", error);
    return NextResponse.json(
      { message: "Error fetching cashflow data", error },
      { status: 500 }
    );
  }
}
