import { NextResponse } from "next/server";
import sql from "mssql";

import { connectDb } from "@/db/config";

export async function GET() {
  const pool = await connectDb();

  try {
    // Get today's date
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

    // Query for payment requests
    const paymentRequestsQuery = `
      SELECT COUNT(*) AS count
      FROM payment_requests
      WHERE FORMAT(due_date, 'yyyy-MM-dd') = @today
        AND status IN ('Approved', 'Transfer Completed');
    `;
    const paymentRequestsResult = await pool
      .request()
      .input("today", sql.Date, today)
      .query(paymentRequestsQuery);

    const paymentRequestsCount = paymentRequestsResult.recordset[0].count;

    // Query for monthly payments
    const monthlyPaymentsQuery = `
      SELECT COUNT(*) AS count
      FROM monthly_payments
      WHERE day_of_month = DAY(@today);
    `;
    const monthlyPaymentsResult = await pool
      .request()
      .input("today", sql.Date, today)
      .query(monthlyPaymentsQuery);

    const monthlyPaymentsCount = monthlyPaymentsResult.recordset[0].count;

    // Query for scheduled payments
    const scheduledPaymentsQuery = `
      SELECT COUNT(*) AS count
      FROM scheduled_payments
      WHERE FORMAT(date, 'yyyy-MM-dd') = @today;
    `;
    const scheduledPaymentsResult = await pool
      .request()
      .input("today", sql.Date, today)
      .query(scheduledPaymentsQuery);

    const scheduledPaymentsCount = scheduledPaymentsResult.recordset[0].count;

    // Return the counts
    return NextResponse.json(
      {
        paymentRequestsCount,
        monthlyPaymentsCount,
        scheduledPaymentsCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard summary.", error },
      { status: 500 }
    );
  }
}
