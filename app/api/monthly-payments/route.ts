//Dependencies
import sql from "mssql";
import { NextRequest, NextResponse } from "next/server";

// Local Imports
import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares/verify-auth";
import { logAction } from "@/utils";

// GET: Fetch all monthly payments
export async function GET() {
  const pool = await connectDb();

  try {
    const query = `
      SELECT 
        mp.id,
        mp.day_of_month,
        mp.ledger_id,
        l.name AS ledger_name,
        mp.hotel_id,
        h.name AS hotel_name,
        mp.amount,
        mp.payment_status
      FROM 
        monthly_payments mp
      JOIN 
        monthly_payment_ledgers l ON mp.ledger_id = l.id
      JOIN 
        hotels h ON mp.hotel_id = h.id
      ORDER BY 
        mp.day_of_month ASC;
    `;

    const result = await pool.request().query(query);

    return NextResponse.json(result.recordset, { status: 200 });
  } catch (error) {
    console.error("Error fetching monthly payments:", error);
    return NextResponse.json(
      { message: "Error fetching monthly payments", error },
      { status: 500 }
    );
  }
}
// POST: Create a new monthly payment
export async function POST(req: NextRequest) {
  const { isAuthorized, user, message } = await verifyAuth(req, [
    "Admin",
    "System-Admin",
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const action = "Create Monthly Payment";
  const pool = await connectDb();

  // Extract request payload
  const { day_of_month, ledger_id, hotel_id, amount, payment_status } =
    await req.json();

  try {
    // ✅ Step 1: Fetch Last Closing Balance Before Payment Date
    const closingBalanceQuery = `
      SELECT TOP 1 closing 
      FROM cashflow 
      WHERE date < DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), @day_of_month) 
      ORDER BY date DESC;
    `;

    const closingBalanceResult = await pool
      .request()
      .input("day_of_month", sql.Int, day_of_month)
      .query(closingBalanceQuery);

    const previousClosing = closingBalanceResult.recordset[0]?.closing || 0;

    // ✅ Step 2: Check If Actual Inflow Exists on the Payment Date
    const actualInflowQuery = `
      SELECT actual_inflow 
      FROM cashflow 
      WHERE date = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), @day_of_month);
    `;

    const actualInflowResult = await pool
      .request()
      .input("day_of_month", sql.Int, day_of_month)
      .query(actualInflowQuery);

    const actualInflow = actualInflowResult.recordset[0]?.actual_inflow || 0;

    // ✅ Step 3: Validate Payment Against Closing Balance
    const newClosing = previousClosing - amount;

    if (newClosing < 0) {
      return NextResponse.json(
        {
          message: `Insufficient balance. Cannot create monthly payment.`,
        },
        { status: 400 }
      );
    }

    // ✅ Step 4: Prevent Payment Creation If No Actual Inflow
    if (actualInflow === 0) {
      return NextResponse.json(
        {
          message: `No actual inflow exists on this date. Cannot create monthly payment.`,
        },
        { status: 400 }
      );
    }

    // ✅ Step 5: Insert the Monthly Payment
    const insertQuery = `
      INSERT INTO monthly_payments (day_of_month, ledger_id, hotel_id, amount, payment_status)
      VALUES (@day_of_month, @ledger_id, @hotel_id, @amount, @payment_status);
    `;

    await pool
      .request()
      .input("day_of_month", sql.Int, day_of_month)
      .input("ledger_id", sql.Int, ledger_id)
      .input("hotel_id", sql.Int, hotel_id)
      .input("amount", sql.Decimal(18, 2), amount)
      .input("payment_status", sql.NVarChar, payment_status)
      .query(insertQuery);

    // ✅ Step 6: Log the Action
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "monthly_payments",
      action,
      `Created monthly payment for hotel_id: ${hotel_id}, amount: ${amount}, day_of_month: ${day_of_month}`
    );

    return NextResponse.json(
      { message: "Monthly payment created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating monthly payment:", error);
    return NextResponse.json(
      { message: "Error creating monthly payment", error },
      { status: 500 }
    );
  }
}

// PATCH: Update specific fields of a payment (amount)
export async function PATCH(req: NextRequest) {
  try {
    const { isAuthorized, user, message } = await verifyAuth(req, ["Admin","System-Admin"]);

    if (!isAuthorized) {
      return NextResponse.json({ message }, { status: 403 });
    }
      const action = 'Update Monthly Payment';
    const { id, amount } = await req.json();

    if (!id || amount === undefined) {
      return NextResponse.json(
        { message: "Missing required fields: id or amount" },
        { status: 400 }
      );
    }

    const pool = await connectDb();

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("amount", sql.Decimal(18, 2), amount).query(`
        UPDATE monthly_payments
        SET amount = @amount, updated_at = GETDATE()
        WHERE id = @id;
      `);
      await logAction(
          pool,
          user?.id || null,
          user?.role || null,
          "monthly_payments",
          action,
          `Updated monthly payments with id :- ${id}`
      )

    return NextResponse.json(
      { message: "Payment amount updated successfully" },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error updating payment amount:", error);
    return NextResponse.json(
      { message: "Error updating payment amount", error },
      { status: 500 }
    );
  }
}

// PUT: Update entire payment record
export async function PUT(req: NextRequest) {
  const { isAuthorized, user } = await verifyAuth(req, [
    "Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const pool = await connectDb();
  const { id, day_of_month, ledger_id, hotel_id, amount, payment_status } =
    await req.json();

  if (!id) {
    return NextResponse.json(
      { message: "Payment ID is required for update" },
      { status: 400 }
    );
  }

  try {
    // ✅ Step 1: Fetch Previous Payment Amount
    const previousPaymentQuery = `SELECT amount FROM monthly_payments WHERE id = @id;`;
    const previousPaymentResult = await pool
      .request()
      .input("id", sql.Int, id)
      .query(previousPaymentQuery);

    if (!previousPaymentResult.recordset.length) {
      return NextResponse.json(
        { message: "Payment not found" },
        { status: 404 }
      );
    }

    const previousAmount = previousPaymentResult.recordset[0].amount;

    // ✅ Step 2: Fetch Last Closing Balance Before Payment Date
    const closingBalanceQuery = `
      SELECT TOP 1 closing 
      FROM cashflow 
      WHERE date < DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), @day_of_month) 
      ORDER BY date DESC;
    `;

    const closingBalanceResult = await pool
      .request()
      .input("day_of_month", sql.Int, day_of_month)
      .query(closingBalanceQuery);

    const previousClosing = closingBalanceResult.recordset[0]?.closing || 0;

    // ✅ Step 3: Check If Actual Inflow Exists on the Payment Date
    const actualInflowQuery = `
      SELECT actual_inflow 
      FROM cashflow 
      WHERE date = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), @day_of_month);
    `;

    const actualInflowResult = await pool
      .request()
      .input("day_of_month", sql.Int, day_of_month)
      .query(actualInflowQuery);

    const actualInflow = actualInflowResult.recordset[0]?.actual_inflow || 0;

    // ✅ Step 4: Calculate Effect on Closing Balance
    const adjustedClosing = previousClosing + previousAmount - amount; // Refund previous amount before deducting new

    if (adjustedClosing < 0) {
      return NextResponse.json(
        { message: `Insufficient balance. Cannot update monthly payment.` },
        { status: 400 }
      );
    }

    // ✅ Step 5: Prevent Update If No Actual Inflow
    if (actualInflow === 0) {
      return NextResponse.json(
        {
          message: `No actual inflow exists on this date. Cannot update monthly payment.`,
        },
        { status: 400 }
      );
    }

    // ✅ Step 6: Update the Monthly Payment
    const query = `
      UPDATE monthly_payments
      SET 
        day_of_month = @day_of_month,
        ledger_id = @ledger_id,
        hotel_id = @hotel_id,
        amount = @amount,
        payment_status = @payment_status,
        updated_at = GETDATE()
      WHERE id = @id;
    `;

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("day_of_month", sql.Int, day_of_month)
      .input("ledger_id", sql.Int, ledger_id)
      .input("hotel_id", sql.Int, hotel_id)
      .input("amount", sql.Decimal(18, 2), amount)
      .input("payment_status", sql.NVarChar, payment_status)
      .query(query);

    // ✅ Step 7: Log the Action
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "monthly_payments",
      "Update Monthly Payment",
      `Updated monthly payment ID: ${id}, New Amount: ${amount}, Day: ${day_of_month}`
    );

    return NextResponse.json(
      { message: "Monthly payment updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { message: "Error updating payment", error },
      { status: 500 }
    );
  }
}

// DELETE: Delete a payment record
export async function DELETE(req: NextRequest) {
  const { isAuthorized, message } = await verifyAuth(req, ["Admin","System-Admin"]);

  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json(
      { message: "Payment ID is required for deletion" },
      { status: 400 }
    );
  }

  const pool = await connectDb();

  try {
    await pool.request().input("id", sql.Int, id).query(`
      DELETE FROM monthly_payments
      WHERE id = @id;
    `);

    return NextResponse.json(
      { message: "Payment deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { message: "Error deleting payment", error },
      { status: 500 }
    );
  }
}
