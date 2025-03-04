// import { connectDb } from "@/db/config";
// import { verifyAuth } from "@/middlewares";
// import { NextRequest, NextResponse } from "next/server";
// import sql from "mssql";

// export async function PUT(req: NextRequest): Promise<NextResponse> {
//   const { isAuthorized, message } = await verifyAuth(req, [
//     "Admin",
//     "Sub-Admin",
//     "System-Admin",
//   ]);
//   if (!isAuthorized) {
//     return NextResponse.json({ message }, { status: 403 });
//   }

//   const { date, amount } = await req.json();
//   if (!date || amount === undefined) {
//     return NextResponse.json(
//       { message: "Date and amount are required." },
//       { status: 400 }
//     );
//   }

//   const pool = await connectDb();

//   try {
//     const transaction = pool.transaction();
//     await transaction.begin();

//     // Update Actual Inflow amount for the given date
//     await transaction
//       .request()
//       .input("date", sql.Date, date)
//       .input("amount", sql.Decimal(18, 2), amount).query(`
//       UPDATE actual_inflow 
//       SET amount = @amount
//       WHERE date = @date;
//     `);

//     // Update Cashflow Table to Reflect Changes in Actual Inflow
//     await transaction.request().input("date", sql.Date, date).query(`
//         UPDATE cashflow
//         SET actual_inflow = (
//             SELECT COALESCE(SUM(amount), 0) 
//             FROM actual_inflow
//             WHERE date = @date
//         ),
//         updated_at = GETDATE()
//         WHERE date = @date;
//     `);

//     await transaction.commit();

//     return NextResponse.json(
//       { message: "Actual Inflow updated successfully." },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error updating Actual Inflow:", error);
//     return NextResponse.json(
//       { message: "Error updating Actual Inflow.", error },
//       { status: 500 }
//     );
//   }
// }

import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { isAuthorized, message } = await verifyAuth(req, [
    "Admin",
    "Sub-Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ message: "Date is required." }, { status: 400 });
  }

  const pool = await connectDb();

  try {
    // Fetch actual inflow and its breakdown per ledger
    const query = `
      SELECT 
        ai.id AS actual_inflow_id, 
        ai.amount AS total_actual_inflow, 
        ail.ledger_id, 
        l.name AS ledger_name, 
        ail.amount AS ledger_amount
      FROM actual_inflow ai
      LEFT JOIN actual_inflow_ledgers ail ON ai.id = ail.actual_inflow_id
      LEFT JOIN ledgers l ON ail.ledger_id = l.id
      WHERE ai.date = @date
    `;

    const result = await pool
      .request()
      .input("date", sql.Date, date)
      .query(query);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { message: "No actual inflow found." },
        { status: 404 }
      );
    }

    // Convert results into a structured format
    const actualInflow = {
      actual_inflow_id: result.recordset[0].actual_inflow_id,
      total_actual_inflow: result.recordset[0].total_actual_inflow,
      ledgers: result.recordset.map((row) => ({
        id: row.ledger_id,
        name: row.ledger_name,
        amount: row.ledger_amount,
      })),
    };

    return NextResponse.json(actualInflow, { status: 200 });
  } catch (error) {
    console.error("Error fetching actual inflow:", error);
    return NextResponse.json(
      { message: "Error fetching actual inflow.", error },
      { status: 500 }
    );
  }
}


export async function PUT(req: NextRequest): Promise<NextResponse> {
  const { isAuthorized, message } = await verifyAuth(req, [
    "Admin",
    "Sub-Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const { date, ledgers } = await req.json();
  if (!date || !Array.isArray(ledgers) || ledgers.length === 0) {
    return NextResponse.json(
      { message: "Date and valid ledgers data are required." },
      { status: 400 }
    );
  }

  console.log("Updating actual inflow for date:", date, "Ledgers:", ledgers);

  const pool = await connectDb();
  const transaction = pool.transaction();

  try {
    await transaction.begin();

    // ✅ Step 1: Fetch Actual Inflow ID for the given date
    const actualInflowResult = await transaction
      .request()
      .input("date", sql.Date, date)
      .query(`SELECT id FROM actual_inflow WHERE date = @date`);

    if (!actualInflowResult.recordset.length) {
      return NextResponse.json(
        { message: "Actual Inflow record not found for the given date." },
        { status: 404 }
      );
    }

    const actualInflowId = actualInflowResult.recordset[0].id;

    // ✅ Step 2: Update Each Ledger's Amount
    let rowsUpdated = 0;
    for (const ledger of ledgers) {
      const updateResult = await transaction
        .request()
        .input("actual_inflow_id", sql.Int, actualInflowId)
        .input("ledger_id", sql.Int, ledger.id)
        .input("amount", sql.Decimal(18, 2), ledger.amount).query(`
          UPDATE actual_inflow_ledgers
          SET amount = @amount
          WHERE actual_inflow_id = @actual_inflow_id AND ledger_id = @ledger_id
      `);

      rowsUpdated += updateResult.rowsAffected[0]; // Count rows affected
    }

    if (rowsUpdated === 0) {
      return NextResponse.json(
        { message: "No ledger records were updated. Check input data." },
        { status: 400 }
      );
    }

    // ✅ Step 3: Update Total Actual Inflow Amount
    const totalUpdateResult = await transaction
      .request()
      .input("actual_inflow_id", sql.Int, actualInflowId).query(`
        UPDATE actual_inflow 
        SET amount = (
          SELECT COALESCE(SUM(amount), 0) FROM actual_inflow_ledgers
          WHERE actual_inflow_id = @actual_inflow_id
        )
        WHERE id = @actual_inflow_id;
    `);

    if (!totalUpdateResult.rowsAffected[0]) {
      return NextResponse.json(
        { message: "Failed to update total actual inflow." },
        { status: 500 }
      );
    }

    // ✅ Step 4: Update Cashflow Table
    const cashflowUpdateResult = await transaction
      .request()
      .input("date", sql.Date, date).query(`
        UPDATE cashflow
        SET actual_inflow = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM actual_inflow
            WHERE date = @date
        ),
        updated_at = GETDATE()
        WHERE date = @date;
    `);

    if (!cashflowUpdateResult.rowsAffected[0]) {
      return NextResponse.json(
        { message: "Cashflow update failed." },
        { status: 500 }
      );
    }

    // ✅ Step 5: Trigger Closing Update
    await transaction.request().query(`EXEC sp_update_closing;`);

    await transaction.commit();

    return NextResponse.json(
      { message: "Actual Inflow breakdown updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating Actual Inflow breakdown:", error);
    await transaction.rollback();
    return NextResponse.json(
      { message: "Error updating Actual Inflow breakdown.", error },
      { status: 500 }
    );
  }
}
