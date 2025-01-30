import { NextRequest, NextResponse } from "next/server";

import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
import { dbQuery, logAction } from "@/utils";
import { CreateLedgerRequest } from "@/types";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { isAuthorized, message } = await verifyAuth(req, [
    "Admin",
    "Sub-Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }
  const pool = await connectDb();
  const { id } = await context.params;
  const ledgerId = parseInt(id, 10);
  if (isNaN(ledgerId)) {
    return NextResponse.json({ message: "Invalid ledger ID" }, { status: 400 });
  }
  try {
    const query = `SELECT id, name FROM monthly_payment_ledgers WHERE id = @ledgerId`;
    const result = await dbQuery(pool, query, { ledgerId });
    if (!result.recordset.length) {
      return NextResponse.json(
        { message: "Ledger not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch ledger", error },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { isAuthorized, message, user } = await verifyAuth(req, [
    "Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }
  const action = "Update Ledger";
  const { id } = await context.params;
  const ledgerId = parseInt(id, 10);
  const { name }: CreateLedgerRequest = await req.json();

  if (isNaN(ledgerId)) {
    return NextResponse.json({ message: "Invalid ledger ID" }, { status: 400 });
  }
  const pool = await connectDb();

  try {
    const query = `
      UPDATE monthly_payment_ledgers
      SET name = @name
      OUTPUT INSERTED.id, INSERTED.name
      WHERE id = @id
    `;
    const result = await dbQuery(pool, query, { name, id: ledgerId });

    if (!result.recordset.length) {
      return NextResponse.json(
        { message: "Ledger not found" },
        { status: 404 }
      );
    }

    const updatedLedger = result.recordset[0];
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "monthly_payment_ledgers",
      action,
      `Updated ledger with ID: ${ledgerId}`
    );

    return NextResponse.json(
      { message: "Ledger updated successfully", ledger: updatedLedger },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update ledger", error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { isAuthorized, message, user } = await verifyAuth(req, [
    "Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }
  const action = "Delete Ledger";
  const { id } = await context.params;
  const ledgerId = parseInt(id, 10);
  if (isNaN(ledgerId)) {
    return NextResponse.json({ message: "Invalid ledger ID" }, { status: 400 });
  }
  const pool = await connectDb();

  try {
    const query = `
      DELETE FROM monthly_payment_ledgers
      OUTPUT DELETED.id
      WHERE id = @ledgerId
    `;
    const result = await dbQuery(pool, query, { ledgerId });

    if (!result.recordset.length) {
      return NextResponse.json(
        { message: "Ledger not found" },
        { status: 404 }
      );
    }

    const deletedLedgerId = result.recordset[0].id;
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "monthly_payment_ledgers",
      action,
      `Deleted ledger with ID: ${deletedLedgerId}`
    );


    return NextResponse.json(
      { message: "Ledger deleted successfully", ledgerId: deletedLedgerId },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete ledger", error },
      { status: 500 }
    );
  }
}
