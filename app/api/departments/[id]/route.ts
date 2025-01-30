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
  const departmentId = parseInt(id, 10);

  if (isNaN(departmentId)) {
    return NextResponse.json(
      { message: "Invalid department ID" },
      { status: 400 }
    );
  }

  try {
    const query = `
      SELECT id, name, FORMAT(created_at, 'yyyy-MM-dd') AS created_at, 
             FORMAT(updated_at, 'yyyy-MM-dd') AS updated_at 
      FROM hotel_departments 
      WHERE id = @id;
    `;
    const result = await dbQuery(pool, query, { id: departmentId });

    if (!result.recordset.length) {
      return NextResponse.json(
        { message: "Department not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch department", error },
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

  const action = "Update Department";
  const { id } = await context.params;
  const departmentId = parseInt(id, 10);
  const { name } = await req.json();

  if (isNaN(departmentId)) {
    return NextResponse.json(
      { message: "Invalid department ID" },
      { status: 400 }
    );
  }

  const pool = await connectDb();
  try {
    const query = `
      UPDATE hotel_departments
      SET name = @name, updated_at = GETDATE()
      OUTPUT INSERTED.id, INSERTED.name, FORMAT(INSERTED.created_at, 'yyyy-MM-dd') AS created_at, 
             FORMAT(INSERTED.updated_at, 'yyyy-MM-dd') AS updated_at
      WHERE id = @id;
    `;
    const result = await dbQuery(pool, query, { name, id: departmentId });

    if (!result.recordset.length) {
      return NextResponse.json(
        { message: "Department not found" },
        { status: 404 }
      );
    }

    const updatedDepartment = result.recordset[0];

    // Log the action
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "hotel_departments",
      action,
      `Updated department with id: ${departmentId}`
    );

    return NextResponse.json(
      {
        message: "Department updated successfully",
        department: updatedDepartment,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update department", error },
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

  const action = "Delete Department";
  const { id } = await context.params;
  const departmentId = parseInt(id, 10);

  if (isNaN(departmentId)) {
    return NextResponse.json(
      { message: "Invalid department ID" },
      { status: 400 }
    );
  }

  const pool = await connectDb();
  try {
    const query = `
      DELETE FROM hotel_departments 
      OUTPUT DELETED.id
      WHERE id = @id;
    `;
    const result = await dbQuery(pool, query, { id: departmentId });

    if (!result.recordset.length) {
      return NextResponse.json(
        { message: "Department not found" },
        { status: 404 }
      );
    }

    const deletedDepartmentId = result.recordset[0].id;

    // Log the action
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "hotel_departments",
      action,
      `Deleted department with id: ${departmentId}`
    );

    return NextResponse.json(
      { message: "Department deleted successfully", id: deletedDepartmentId },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete department", error },
      { status: 500 }
    );
  }
}
