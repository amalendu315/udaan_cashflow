import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
import sql from "mssql";

// ✅ Correctly define context type
// interface RouteContext {
//   params: { id: string };
// }

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // ✅ Verify Authorization
  const { isAuthorized, message } = await verifyAuth(req, [
    "Admin",
    "System-Admin",
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  // ✅ Ensure `id` exists in `context.params`
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { message: "Missing Projected Inflow ID" },
      { status: 400 }
    );
  }

  // ✅ Convert `id` to a number and validate it
  const inflowId = Number(id);
  if (isNaN(inflowId) || inflowId <= 0) {
    return NextResponse.json(
      { message: "Invalid Projected Inflow ID" },
      { status: 400 }
    );
  }

  // ✅ Parse request body safely
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid JSON input", error },
      { status: 400 }
    );
  }

  // ✅ Ensure the body has the correct format
  const { ledgers }: { ledgers: Array<{ ledger_id: number; amount: number }> } =
    body;
  if (!Array.isArray(ledgers) || ledgers.length === 0) {
    return NextResponse.json(
      { message: "Invalid input. At least one ledger is required." },
      { status: 400 }
    );
  }

  // ✅ Establish Database Connection
  const pool = await connectDb();

  try {
    // ✅ Begin Transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Step 1: Delete existing ledger entries for the given projected inflow ID
      await transaction
        .request()
        .input("projected_inflow_id", inflowId)
        .query(
          `DELETE FROM projected_inflow_ledgers WHERE projected_inflow_id = @projected_inflow_id`
        );

      // Step 2: Insert new ledger values
      for (const { ledger_id, amount } of ledgers) {
        await transaction
          .request()
          .input("projected_inflow_id", inflowId)
          .input("ledger_id", ledger_id)
          .input("amount", amount).query(`
            INSERT INTO projected_inflow_ledgers (projected_inflow_id, ledger_id, amount)
            VALUES (@projected_inflow_id, @ledger_id, @amount)
          `);
      }

      // Step 3: Calculate the new total projected inflow amount
      const totalAmountResult = await transaction
        .request()
        .input("projected_inflow_id", inflowId).query(`
          SELECT SUM(amount) AS total_amount 
          FROM projected_inflow_ledgers 
          WHERE projected_inflow_id = @projected_inflow_id
        `);

      const totalAmount = totalAmountResult.recordset[0]?.total_amount || 0;

      // Step 4: Retrieve the associated date from projected_inflow
      const dateResult = await transaction.request().input("id", inflowId)
        .query(`
          SELECT date FROM projected_inflow WHERE id = @id
        `);

      const date = dateResult.recordset[0]?.date;
      if (!date) {
        throw new Error("Projected inflow entry not found.");
      }

      // Step 5: Update projected inflow total amount
      await transaction
        .request()
        .input("id", inflowId)
        .input("total_amount", totalAmount).query(`
          UPDATE projected_inflow 
          SET total_amount = @total_amount 
          WHERE id = @id
        `);

      // Step 6: Update the cashflow table for the corresponding date
      await transaction
        .request()
        .input("date", date)
        .input("projected_inflow", totalAmount)
        .query(`
          UPDATE cashflow 
          SET projected_inflow = @projected_inflow
          WHERE date = @date
        `);

      // ✅ Commit Transaction
      await transaction.commit();

      return NextResponse.json(
        {
          message: "Projected inflow and cashflow updated successfully",
        },
        { status: 200 }
      );
    } catch (err) {
      await transaction.rollback();
      console.error("Transaction rolled back due to error:", err);
      return NextResponse.json(
        { message: "Database transaction failed", error: err },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating projected inflow:", error);
    return NextResponse.json(
      { message: "Failed to update projected inflow", error },
      { status: 500 }
    );
  }
}
