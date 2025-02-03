import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { isAuthorized, message } = await verifyAuth(req, [
    "Admin",
    "Sub-Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const { month } = await req.json(); // Expected format: "YYYY-MM"
  if (!month) {
    return NextResponse.json(
      { message: "Month is required." },
      { status: 400 }
    );
  }

  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) {
    return NextResponse.json(
      { message: "Invalid month format." },
      { status: 400 }
    );
  }

  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const pool = await connectDb();

  try {
    const transaction = pool.transaction();
    await transaction.begin();

    // Get all ledger IDs
    const ledgerNamesResult = await transaction.request().query(`
      SELECT id FROM ledgers
    `);
    const ledgerIds = ledgerNamesResult.recordset.map((ledger) => ledger.id);

    const rows = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(year, monthNumber - 1, day))
        .toISOString()
        .split("T")[0];

      // Get existing total payments for the date
      const paymentResult = await transaction
        .request()
        .input("date", sql.Date, date).query(`
          SELECT COALESCE(
            (SELECT SUM(amount) FROM payment_requests WHERE due_date = @date AND status = 'Transfer Completed'), 0
          ) +
          COALESCE(
            (SELECT SUM(amount) FROM monthly_payments WHERE DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), day_of_month) = @date), 0
          ) +
          COALESCE(
            (SELECT SUM(total_amount) FROM scheduled_payments WHERE date = @date), 0
          ) AS total_payments;
        `);

      const totalPayments = paymentResult.recordset[0]?.total_payments || 0;

      // Insert into projected_inflow table
      const projectedInflowResult = await transaction
        .request()
        .input("date", sql.Date, date)
        .input("total_amount", sql.Decimal(18, 2), 0).query(`
        DECLARE @InsertedIds TABLE (id INT);
        
        INSERT INTO projected_inflow (date, total_amount)
        OUTPUT INSERTED.id INTO @InsertedIds
        VALUES (@date, @total_amount);
        
        SELECT id FROM @InsertedIds;
      `);

      const projectedInflowId = projectedInflowResult.recordset[0].id;

      // Insert into actual_inflow table with amount 0 and get its ID
      const actualInflowResult = await transaction
        .request()
        .input("date", sql.Date, date)
        .input("amount", sql.Decimal(18, 2), 0)
        .input("projected_inflow_id", sql.Int, projectedInflowId).query(`
        DECLARE @InsertedActualIds TABLE (id INT);
        
        INSERT INTO actual_inflow (date, amount, projected_inflow_id)
        OUTPUT INSERTED.id INTO @InsertedActualIds
        VALUES (@date, @amount, @projected_inflow_id);
        
        SELECT id FROM @InsertedActualIds;
      `);

      const actualInflowId = actualInflowResult.recordset[0].id;

      // Insert into projected_inflow_ledgers for each ledger
      for (const ledgerId of ledgerIds) {
        await transaction
          .request()
          .input("projected_inflow_id", sql.Int, projectedInflowId)
          .input("ledger_id", sql.Int, ledgerId)
          .input("amount", sql.Decimal(18, 2), 0).query(`
          INSERT INTO projected_inflow_ledgers (projected_inflow_id, ledger_id, amount)
          VALUES (@projected_inflow_id, @ledger_id, @amount)
        `);
      }

      // Insert or update cashflow table with projected and actual inflows
      await transaction
        .request()
        .input("date", sql.Date, date)
        .input("actual_inflow_id", sql.Int, actualInflowId)
        .input("total_payments", sql.Decimal(18, 2), totalPayments).query(`
          MERGE INTO cashflow AS target
          USING (
            SELECT 
              @date AS date,
              COALESCE(SUM(total_amount), 0) AS projected_inflow
            FROM projected_inflow
            WHERE CAST(date AS DATE) = CAST(@date AS DATE)
          ) AS source
          ON target.date = source.date
          WHEN MATCHED THEN 
            UPDATE SET 
              target.projected_inflow = source.projected_inflow,
              target.actual_inflow_id = @actual_inflow_id,
              target.total_payments = @total_payments,
              target.updated_at = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (date, projected_inflow, actual_inflow_id, total_payments, closing, created_at, updated_at)
            VALUES (source.date, source.projected_inflow, @actual_inflow_id, @total_payments, source.projected_inflow - @total_payments, GETDATE(), GETDATE());
        `);

      rows.push({
        id: projectedInflowId,
        date,
        actual_inflow_id: actualInflowId,
        total_payments: totalPayments,
        ...Object.fromEntries(ledgerIds.map((id) => [`Ledger ${id}`, 0])),
      });
    }

    await transaction.commit();

    return NextResponse.json(
      {
        message:
          "Projected inflow, actual inflow (linked by ID), and cashflow updated successfully.",
        rows,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in bulk projected inflow:", error);
    return NextResponse.json(
      { message: "Error creating projected inflows.", error },
      { status: 500 }
    );
  }
}
