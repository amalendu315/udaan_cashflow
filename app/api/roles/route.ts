import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
import { CreateRoleRequest } from "@/types";
import { dbQuery, logAction } from "@/utils";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { isAuthorized, message } = await verifyAuth(req, [
    "Admin",
    "Sub-Admin",
    "System-Admin",
    "User"
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }
  const pool = await connectDb();

  try {
    const query = "SELECT id, role_name FROM roles";
    const result = await dbQuery(pool, query);

    return NextResponse.json(result.recordset);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch roles", error },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { isAuthorized, message, user } = await verifyAuth(req, [
    "Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const action = "Create Role";
  const { role_name }: CreateRoleRequest = await req.json();
  const pool = await connectDb();

  try {
    const query = `
      INSERT INTO roles (role_name, created_at, updated_at)
      OUTPUT INSERTED.id, INSERTED.role_name
      VALUES (@role_name, GETDATE(), GETDATE())
    `;
    const result = await dbQuery(pool, query, { role_name });
    const newRole = result.recordset[0];

    // Log the action and broadcast
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "roles",
      action,
      `Created role with rolename: ${role_name}`
    );

    return NextResponse.json(
      { message: "Role created successfully", role: newRole },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error creating role", error },
      { status: 500 }
    );
  }
}
