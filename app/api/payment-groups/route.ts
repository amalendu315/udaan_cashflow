import { NextRequest, NextResponse } from "next/server";

import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
import { CreatePaymentGroupRequest } from "@/types";
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
    const query = `SELECT 
        id,
        name,
        FORMAT(created_at, 'yyyy-MM-dd') AS created_at,
        FORMAT(updated_at, 'yyyy-MM-dd') AS updated_at
      FROM 
        payment_groups
      ORDER BY 
        name ASC`;
    const result = await dbQuery(pool, query);
    return NextResponse.json(result.recordset);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch payment groups", error },
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

  const action = "Create Payment Group";
  const { name }: CreatePaymentGroupRequest = await req.json();
  const pool = await connectDb();

  try {
    const query = `
      INSERT INTO payment_groups (name, created_at, updated_at)
      OUTPUT INSERTED.id, INSERTED.name, FORMAT(INSERTED.created_at, 'yyyy-MM-dd') AS created_at,
             FORMAT(INSERTED.updated_at, 'yyyy-MM-dd') AS updated_at
      VALUES (@name, GETDATE(), GETDATE())`;

    const result = await dbQuery(pool, query, { name });
    const newGroup = result.recordset[0];

    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "payment_groups",
      action,
      `Created payment group with name: ${name}`
    );


    return NextResponse.json(
      { message: "Payment Group created successfully", newGroup },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error creating payment group", error },
      { status: 500 }
    );
  }
}
