import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";

export async function GET(req: NextRequest) {
  const { isAuthorized, message } = await verifyAuth(req, [
    "Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const pool = await connectDb();

  try {
    const query = `
      SELECT 
        FORMAT(c.date, 'yyyy-MM-dd') AS date,
        COALESCE(SUM(c.projected_inflow), 0) AS projected_inflow,
        COALESCE(SUM(ai.amount), 0) AS actual_inflow,
        COALESCE(SUM(p.total_payments), 0) AS payments,
        COALESCE(SUM(c.closing), 0) AS closing
      FROM cashflow c
      LEFT JOIN actual_inflow ai ON c.actual_inflow_id = ai.id
      LEFT JOIN v_cashflow_with_payments p ON c.date = p.date
      WHERE c.date IS NOT NULL
      GROUP BY FORMAT(c.date, 'yyyy-MM-dd')
      ORDER BY date ASC;
    `;

    const result = await pool.request().query(query);

    return NextResponse.json({ data: result.recordset }, { status: 200 });
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json(
      { message: "Error fetching chart data", error },
      { status: 500 }
    );
  }
}
