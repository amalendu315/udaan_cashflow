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

  // ✅ Fix: Get the correct number of days in the given month
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
      // ✅ Explicitly ensure the correct month and prevent rollovers
      const date = new Date(Date.UTC(year, monthNumber - 1, day))
        .toISOString()
        .split("T")[0];

      // Insert into projected_inflow table with fixed OUTPUT issue
      const result = await transaction
        .request()
        .input("date", sql.Date, date)
        .input("total_amount", sql.Decimal(18, 2), 0).query(`
      DECLARE @InsertedIds TABLE (id INT);
      
      INSERT INTO projected_inflow (date, total_amount)
      OUTPUT INSERTED.id INTO @InsertedIds
      VALUES (@date, @total_amount);
      
      SELECT id FROM @InsertedIds;
    `);

      const inflowId = result.recordset[0].id;

      // Insert into projected_inflow_ledgers for each ledger with amount 0
      for (const ledgerId of ledgerIds) {
        await transaction
          .request()
          .input("projected_inflow_id", sql.Int, inflowId)
          .input("ledger_id", sql.Int, ledgerId)
          .input("amount", sql.Decimal(18, 2), 0).query(`
        INSERT INTO projected_inflow_ledgers (projected_inflow_id, ledger_id, amount)
        VALUES (@projected_inflow_id, @ledger_id, @amount)
      `);
      }

      // Insert or update cashflow table with the new projected inflow
      await transaction.request().input("date", sql.Date, date).query(`
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
              target.actual_inflow = source.projected_inflow,
              target.updated_at = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (date, projected_inflow, actual_inflow, total_payments, closing, created_at, updated_at)
            VALUES (source.date, source.projected_inflow, source.projected_inflow, 0, source.projected_inflow, GETDATE(), GETDATE());
        `);

      rows.push({
        id: inflowId,
        date,
        ...Object.fromEntries(ledgerIds.map((id) => [`Ledger ${id}`, 0])),
      });
    }

    await transaction.commit();

    return NextResponse.json(
      { message: "Projected inflow and cashflow updated successfully.", rows },
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
