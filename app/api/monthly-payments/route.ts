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
        CONVERT(VARCHAR, mp.end_date, 23) AS end_date -- Format as YYYY-MM-DD
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
  const { isAuthorized, user, message } = await verifyAuth(req, ["Admin","System-Admin"]);

  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

    const action = 'Create Monthly Payment';

  const pool = await connectDb();
  const { day_of_month, ledger_id, hotel_id, amount, end_date } =
    await req.json();

  try {
    const query = `
      INSERT INTO monthly_payments (day_of_month, ledger_id, hotel_id, amount, end_date)
      VALUES (@day_of_month, @ledger_id, @hotel_id, @amount, @end_date);
    `;

    await pool
      .request()
      .input("day_of_month", sql.Int, day_of_month)
      .input("ledger_id", sql.Int, ledger_id)
      .input("hotel_id", sql.Int, hotel_id)
      .input("amount", sql.Decimal(18, 2), amount)
      .input("end_date", sql.Date, end_date)
        .query(query);

      await logAction(
          pool,
          user?.id || null,
          user?.role || null,
          "monthly_payments",
          action,
          `Created monthly payments with end date :- ${end_date}`
      )

    return NextResponse.json(
      { message: "Payment created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { message: "Error creating payment", error },
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
  const { isAuthorized } = await verifyAuth(req, ["Admin","System-Admin"]);
  if (!isAuthorized) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const pool = await connectDb();
  const { id, day_of_month, ledger_id, hotel_id, amount, end_date } =
    await req.json();

  if (!id) {
    return NextResponse.json(
      { message: "Payment ID is required for update" },
      { status: 400 }
    );
  }

  try {
    const query = `
      UPDATE monthly_payments
      SET 
        day_of_month = @day_of_month,
        ledger_id = @ledger_id,
        hotel_id = @hotel_id,
        amount = @amount,
        end_date = @end_date,
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
      .input("end_date", sql.Date, end_date)
      .query(query);

    return NextResponse.json(
      { message: "Payment updated successfully" },
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
