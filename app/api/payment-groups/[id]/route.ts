import { NextRequest, NextResponse } from "next/server";

import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
import { dbQuery, logAction } from "@/utils";

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
  const groupId = parseInt(id, 10);

  if (isNaN(groupId)) {
    return NextResponse.json(
      { message: "Invalid payment group id" },
      { status: 400 }
    );
  }

  try {
    const query = `SELECT * FROM payment_groups WHERE id = @groupId`;
    const result = await dbQuery(pool, query, { groupId });

    if (!result.recordset.length) {
      return NextResponse.json(
        { message: "Payment Group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch payment group", error },
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

  const action = "Update Payment Group";
  const { id } = await context.params;
  const groupId = parseInt(id, 10);
  const { name }: { name: string } = await req.json();

  if (isNaN(groupId)) {
    return NextResponse.json(
      { message: "Invalid payment group id" },
      { status: 400 }
    );
  }

  const pool = await connectDb();

  try {
    const query = `
      UPDATE payment_groups
      SET name = @name, updated_at = GETDATE()
      OUTPUT INSERTED.id, INSERTED.name, FORMAT(INSERTED.created_at, 'yyyy-MM-dd') AS created_at,
             FORMAT(INSERTED.updated_at, 'yyyy-MM-dd') AS updated_at
      WHERE id = @id`;

    const result = await dbQuery(pool, query, { name, id: groupId });

    if (!result.rowsAffected[0]) {
      return NextResponse.json(
        { message: "Payment Group not found" },
        { status: 404 }
      );
    }

    const updatedGroup = result.recordset[0];

    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "payment_groups",
      action,
      `Updated payment group with id: ${groupId}`
    );

    // Broadcast real-time event

    return NextResponse.json(
      { message: "Payment Group updated successfully", updatedGroup },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update payment group", error },
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

  const action = "Delete Payment Group";
  const { id } = await context.params;
  const groupId = parseInt(id, 10);

  if (isNaN(groupId)) {
    return NextResponse.json(
      { message: "Invalid payment group id" },
      { status: 400 }
    );
  }

  const pool = await connectDb();

  try {
    const query = `
      DELETE FROM payment_groups
      OUTPUT DELETED.id
      WHERE id = @id`;

    const result = await dbQuery(pool, query, { id: groupId });

    if (!result.rowsAffected[0]) {
      return NextResponse.json(
        { message: "Payment Group not found" },
        { status: 404 }
      );
    }

    const deletedGroupId = result.recordset[0].id;

    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "payment_groups",
      action,
      `Deleted Payment Group with id: ${deletedGroupId}`
    );

    // Broadcast real-time event

    return NextResponse.json(
      { message: "Payment Group deleted successfully", deletedGroupId },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete payment group", error },
      { status: 500 }
    );
  }
}
