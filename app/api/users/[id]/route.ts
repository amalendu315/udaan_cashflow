//import bcrypt from "bcryptjs";
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
  const { id } = await context.params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
  }
  const pool = await connectDb();
  try {
    const query = `SELECT u.id, u.username, u.email, u.role_id, u.hotel_id, r.role_name, h.name
         FROM users u
         INNER JOIN roles r ON u.role_id = r.id
         INNER JOIN hotels h ON u.hotel_id = h.id
         WHERE u.id = @id`;
    const result = await dbQuery(pool, query, { id: userId });
    if (result.recordsets.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json(result.recordset[0]);
  } catch (error:unknown) {
    return NextResponse.json(
      { message: "Error Fetching the User", error },
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
  const action = "Update User";
  const { id } = await context.params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
  }
  const { username, email, role_id, hotel_id } = await req.json();
  const pool = await connectDb();
  try {
    const query = `UPDATE users SET
          username = @username,
          email = @email,
          role_id = @role_id,
          hotel_id = @hotel_id,
          updated_at = GETDATE()
         WHERE id = @id`;
    const result = await dbQuery(pool, query, {
      id: userId,
      username: username,
      email: email,
      role_id: role_id,
      hotel_id: hotel_id,
    });
    if (!result.rowsAffected[0]) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "users",
      action,
      `Updated user with ID ${userId}`
    );
    return NextResponse.json(
      { message: "User updated successfully" },
      { status: 200 }
    );
  } catch (error:unknown) {
    return NextResponse.json(
      { message: "Error Updating the User", error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { isAuthorized, user, message } = await verifyAuth(req, [
    "Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message: message }, { status: 403 });
  }
  const action = "Delete User";
  const { id } = await props.params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ message: "Invalid User ID" }, { status: 400 });
  }
  const pool = await connectDb();
  try {
    const query = `DELETE FROM users where id = @id`;
    const result = await dbQuery(pool, query, { id: userId });
    if (!result.rowsAffected[0]) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "users",
      action,
      `Deleted user with ID ${userId}`
    );
    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error:unknown) {
    return NextResponse.json(
      { message: "Error Deleting the User", error },
      { status: 500 }
    );
  }
}
