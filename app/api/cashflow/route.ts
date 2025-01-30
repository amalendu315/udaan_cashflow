import { NextResponse } from "next/server";
import { connectDb } from "@/db/config";

export async function GET() {
  const pool = await connectDb();

  try {
    // Helper function to run queries and return results
    const runQuery = async (query: string) => {
      const result = await pool.request().query(query);
      return result.recordset;
    };

    // Queries
    const queries = {
      projectedInflows: `
        SELECT 
          FORMAT(date, 'yyyy-MM-dd') AS date,
          SUM(total_amount) AS projected_inflow
        FROM projected_inflow
        GROUP BY FORMAT(date, 'yyyy-MM-dd');
      `,
      paymentRequests: `
        SELECT 
          FORMAT(due_date, 'yyyy-MM-dd') AS date,
          SUM(amount) AS payment_request
        FROM payment_requests
        WHERE status = 'Transfer Completed' 
          OR created_by IN (
              SELECT id FROM users WHERE role_id = '1'
          ) OR created_by IN (
              SELECT id FROM users WHERE role_id = '2'
          )
        GROUP BY FORMAT(due_date, 'yyyy-MM-dd');
      `,
      monthlyPayments: `
        SELECT 
          FORMAT(DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), day_of_month), 'yyyy-MM-dd') AS date,
          SUM(amount) AS monthly_payment
        FROM monthly_payments
        WHERE day_of_month <= DAY(EOMONTH(GETDATE()))
        GROUP BY FORMAT(DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), day_of_month), 'yyyy-MM-dd');
      `,
      scheduledPayments: `
        SELECT 
          FORMAT(date, 'yyyy-MM-dd') AS date,
          SUM(total_amount) AS scheduled_payment
        FROM scheduled_payments
        GROUP BY FORMAT(date, 'yyyy-MM-dd');
      `,
      existingCashflow: `
        SELECT 
          FORMAT(date, 'yyyy-MM-dd') AS date,
          projected_inflow,
          actual_inflow,
          total_payments AS payment,
          closing
        FROM cashflow
        WHERE FORMAT(date, 'yyyy-MM') = FORMAT(GETDATE(), 'yyyy-MM'); -- Current month
      `,
    };

    // Fetch data from all queries
    const [
      projectedInflows,
      paymentRequests,
      monthlyPayments,
      scheduledPayments,
      existingCashflow,
    ] = await Promise.all(
      Object.values(queries).map((query) => runQuery(query))
    );

    // Merge and compute cashflow data
    const mergedData = projectedInflows.map((projected) => {
      const date = projected.date;

      const paymentRequest =
        paymentRequests.find((pr) => pr.date === date)?.payment_request || 0;
      const monthlyPayment =
        monthlyPayments.find((mp) => mp.date === date)?.monthly_payment || 0;
      const scheduledPayment =
        scheduledPayments.find((sp) => sp.date === date)?.scheduled_payment ||
        0;

      const totalPayments = paymentRequest + monthlyPayment + scheduledPayment;

      const cashflow = existingCashflow.find((cf) => cf.date === date);
      const projectedInflow = projected.projected_inflow;

      return {
        date,
        projected_inflow: projectedInflow,
        actual_inflow: cashflow?.actual_inflow || projectedInflow,
        payment: totalPayments,
        closing: (cashflow?.actual_inflow || projectedInflow) - totalPayments,
      };
    });

    return NextResponse.json(mergedData, { status: 200 });
  } catch (error) {
    console.error("Error fetching cashflow data:", error);
    return NextResponse.json(
      { message: "Error fetching cashflow data", error },
      { status: 500 }
    );
  }
}
