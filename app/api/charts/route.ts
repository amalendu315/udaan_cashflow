import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
// import sql from "mssql";

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
        SUM(c.projected_inflow) AS projected_inflow,
        SUM(ai.amount) AS actual_inflow,
        SUM(c.total_payments) AS payments,
        SUM(c.closing) AS closing
      FROM cashflow c
      LEFT JOIN actual_inflow ai ON c.actual_inflow_id = ai.id
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
