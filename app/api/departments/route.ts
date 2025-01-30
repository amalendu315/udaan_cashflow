import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
import { dbQuery, logAction } from "@/utils";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { isAuthorized, message } = await verifyAuth(req, [
    "Admin",
    "Sub-Admin",
    "User",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const pool = await connectDb();
  try {
    const query = `
      SELECT id, name, FORMAT(created_at, 'yyyy-MM-dd') AS created_at, 
             FORMAT(updated_at, 'yyyy-MM-dd') AS updated_at 
      FROM hotel_departments 
      ORDER BY name ASC;
    `;
    const result = await dbQuery(pool, query);
    return NextResponse.json(result.recordset, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch departments", error },
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

  const action = "Create Department";
  const { name } = await req.json();

  const pool = await connectDb();
  try {
    const query = `
      INSERT INTO hotel_departments (name, created_at, updated_at)
      OUTPUT INSERTED.id, INSERTED.name, FORMAT(INSERTED.created_at, 'yyyy-MM-dd') AS created_at, 
             FORMAT(INSERTED.updated_at, 'yyyy-MM-dd') AS updated_at
      VALUES (@name, GETDATE(), GETDATE());
    `;
    const result = await dbQuery(pool, query, { name });
    const newDepartment = result.recordset[0];

    // Log the action
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "hotel_departments",
      action,
      `Created department with name: ${name}`
    );


    return NextResponse.json(
      { message: "Department created successfully", department: newDepartment },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error creating department", error },
      { status: 500 }
    );
  }
}
