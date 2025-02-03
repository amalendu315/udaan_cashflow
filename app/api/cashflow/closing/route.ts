import { connectDb } from "@/db/config";
import { NextResponse } from "next/server";
import sql from "mssql";

export async function PUT(): Promise<NextResponse> {
  const pool = await connectDb();

  try {
    const transaction = pool.transaction();
    await transaction.begin();

    // Retrieve all cashflow records sorted by date
    const cashflowRecords = await transaction.request().query(`
      SELECT date, actual_inflow, projected_inflow, total_payments, closing 
      FROM cashflow
      ORDER BY date ASC;
    `);

    let previousClosing = 0;

    // Update closing dynamically
    for (const record of cashflowRecords.recordset) {
      const { date, actual_inflow, total_payments } = record;
      const newClosing = previousClosing + actual_inflow - total_payments;

      await transaction
        .request()
        .input("date", sql.Date, date)
        .input("closing", sql.Decimal(18, 2), newClosing).query(`
          UPDATE cashflow 
          SET closing = @closing, updated_at = GETDATE()
          WHERE date = @date;
        `);

      previousClosing = newClosing;
    }

    await transaction.commit();

    return NextResponse.json(
      { message: "Closing recalculated successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error recalculating Closing:", error);
    return NextResponse.json(
      { message: "Error recalculating Closing.", error },
      { status: 500 }
    );
  }
}
