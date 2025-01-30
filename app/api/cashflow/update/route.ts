import sql from "mssql";
import { NextResponse } from "next/server";
import { connectDb } from "@/db/config";

export async function PATCH(req: Request) {
  const pool = await connectDb();
  const { due_date } = await req.json();

  try {
    // Fetch projected inflow for the given date
    const projectedInflowQuery = `
      SELECT SUM(total_amount) AS projected_inflow
      FROM projected_inflow
      WHERE FORMAT(date, 'yyyy-MM-dd') = FORMAT(@due_date, 'yyyy-MM-dd');
    `;
    const projectedInflowResult = await pool
      .request()
      .input("due_date", sql.Date, due_date)
      .query(projectedInflowQuery);
    const projectedInflow =
      projectedInflowResult.recordset[0]?.projected_inflow || 0;

    // Fetch payment requests for the given date
    const paymentRequestQuery = `
      SELECT SUM(amount) AS payment_request
      FROM payment_requests
      WHERE (status = 'Transfer Completed' OR created_by = 'Admin')
        AND FORMAT(due_date, 'yyyy-MM-dd') = FORMAT(@due_date, 'yyyy-MM-dd');
    `;
    const paymentRequestResult = await pool
      .request()
      .input("due_date", sql.Date, due_date)
      .query(paymentRequestQuery);
    const paymentRequest =
      paymentRequestResult.recordset[0]?.payment_request || 0;

    // Fetch monthly payments for the given date
    const monthlyPaymentQuery = `
      SELECT SUM(amount) AS monthly_payment
      FROM monthly_payments
      WHERE FORMAT(DATEADD(DAY, day_of_month - 1, '1900-01-01'), 'yyyy-MM-dd') = FORMAT(@due_date, 'yyyy-MM-dd');
    `;
    const monthlyPaymentResult = await pool
      .request()
      .input("due_date", sql.Date, due_date)
      .query(monthlyPaymentQuery);
    const monthlyPayment =
      monthlyPaymentResult.recordset[0]?.monthly_payment || 0;

    // Fetch scheduled payments for the given date
    const scheduledPaymentQuery = `
      SELECT SUM(total_amount) AS scheduled_payment
      FROM scheduled_payments
      WHERE FORMAT(date, 'yyyy-MM-dd') = FORMAT(@due_date, 'yyyy-MM-dd');
    `;
    const scheduledPaymentResult = await pool
      .request()
      .input("due_date", sql.Date, due_date)
      .query(scheduledPaymentQuery);
    const scheduledPayment =
      scheduledPaymentResult.recordset[0]?.scheduled_payment || 0;

    // Calculate total payments
    const totalPayments = paymentRequest + monthlyPayment + scheduledPayment;

    // Set actual inflow equal to projected inflow for now
    const actualInflow = projectedInflow;

    // Calculate closing balance
    const closing = actualInflow - totalPayments;

    // Update or insert into the cashflow table
    const updateCashflowQuery = `
      MERGE INTO cashflow AS target
      USING (SELECT @due_date AS date) AS source
      ON target.date = source.date
      WHEN MATCHED THEN
        UPDATE SET 
          projected_inflow = @projected_inflow,
          actual_inflow = @actual_inflow,
          payment = @totalPayments,
          closing = @closing
      WHEN NOT MATCHED THEN
        INSERT (date, projected_inflow, actual_inflow, payment, closing)
        VALUES (@due_date, @projected_inflow, @actual_inflow, @totalPayments, @closing);
    `;

    await pool
      .request()
      .input("due_date", sql.Date, due_date)
      .input("projected_inflow", sql.Float, projectedInflow)
      .input("actual_inflow", sql.Float, actualInflow)
      .input("totalPayments", sql.Float, totalPayments)
      .input("closing", sql.Float, closing)
      .query(updateCashflowQuery);

    return NextResponse.json(
      { message: "Cashflow updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating cashflow:", error);
    return NextResponse.json(
      { message: "Error updating cashflow.", error },
      { status: 500 }
    );
  }
}
