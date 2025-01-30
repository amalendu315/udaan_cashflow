import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
import { dbQuery, logAction } from "@/utils";
import { CreateRoleRequest } from "@/types";

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
  const {id} = await (context.params);
  const roleId = parseInt(id, 10);
  if (isNaN(roleId)) {
    return NextResponse.json({ message: "Invalid role id" }, { status: 400 });
  }

  try {
    const query = `SELECT * FROM roles WHERE id = @roleId`;
    const result = await dbQuery(pool, query, { roleId });
    if (!result.recordset.length) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }
    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch role", error },
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

  const action = "Update Role";
  const { id } = await (context.params);
  const roleId = parseInt(id, 10);
  const { role_name }: CreateRoleRequest = await req.json();
  const pool = await connectDb();

  try {
    const query = `
      UPDATE roles 
      SET role_name = @role_name, updated_at = GETDATE() 
      OUTPUT INSERTED.id, INSERTED.role_name
      WHERE id = @id
    `;
    const result = await dbQuery(pool, query, { role_name, id: roleId });

    if (!result.recordset.length) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }

    const updatedRole = result.recordset[0];
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "roles",
      action,
      `Updated role with id: ${roleId}`
    );

    return NextResponse.json(
      { message: "Role updated successfully", role: updatedRole },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update role", error },
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

  const action = "Delete Role";
  const { id } = await context.params;
  const roleId = parseInt(id, 10);
  const pool = await connectDb();

  try {
    const query = `
      DELETE FROM roles 
      OUTPUT DELETED.id 
      WHERE id = @id
    `;
    const result = await dbQuery(pool, query, { id: roleId });

    if (!result.recordset.length) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }

    const deletedRoleId = result.recordset[0].id;
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "roles",
      action,
      `Deleted role with id: ${roleId}`
    );

    return NextResponse.json(
      { message: "Role deleted successfully", roleId: deletedRoleId },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete role", error },
      { status: 500 }
    );
  }
}
