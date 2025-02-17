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

export async function PUT(req: NextRequest): Promise<NextResponse> {
  // Authorization Check
  const { isAuthorized, message } = await verifyAuth(req, [
    "Admin",
    "Sub-Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  // Parse Request Body
  const { date, amount } = await req.json();
  if (!date || amount === undefined) {
    return NextResponse.json(
      { message: "Date and amount are required." },
      { status: 400 }
    );
  }

  const pool = await connectDb();
  const transaction = await pool.transaction();

  try {
    await transaction.begin();

    // ✅ Step 1: Update Actual Inflow
    await transaction
      .request()
      .input("date", sql.Date, date)
      .input("amount", sql.Decimal(18, 2), amount).query(`
        UPDATE actual_inflow 
        SET amount = @amount
        WHERE date = @date;
    `);

    // ✅ Step 2: Update Cashflow Table to Reflect New Actual Inflow
    await transaction.request().input("date", sql.Date, date).query(`
        UPDATE cashflow
        SET actual_inflow = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM actual_inflow
            WHERE date = @date
        ),
        updated_at = GETDATE()
        WHERE date = @date;
    `);

    // ✅ Step 3: Trigger Closing Update
    await transaction.request().query(`EXEC sp_update_closing;`);

    await transaction.commit();

    return NextResponse.json(
      { message: "Actual Inflow updated & Closing recalculated successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating Actual Inflow & Closing:", error);

    await transaction.rollback();

    return NextResponse.json(
      { message: "Failed to update Actual Inflow and Closing.", error },
      { status: 500 }
    );
  }
}

