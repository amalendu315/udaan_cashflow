import { NextRequest, NextResponse } from "next/server";

import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
import { CreateVendorRequest } from "@/types";
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
    const query = `SELECT id, name, phone, email, location, description, created_at FROM vendors`;
    const result = await dbQuery(pool, query);

    return NextResponse.json(result.recordset);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch vendors", error },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { isAuthorized, user, message } = await verifyAuth(req, [
    "Admin",
    "System-Admin",
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const action = "Create Vendor";
  const { name, email, description, location, phone }: CreateVendorRequest =
    await req.json();
  const pool = await connectDb();

  try {
    const query = `
      INSERT INTO vendors (name, phone, email, location, description, created_at, updated_at)
      OUTPUT INSERTED.*
      VALUES (@name, @phone, @email, @location, @description, GETDATE(), GETDATE())
    `;
    const result = await dbQuery(pool, query, {
      name,
      phone,
      email,
      location,
      description,
    });

    const newVendor = result.recordset[0];

    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "vendors",
      action,
      `Created Vendor with vendor name: ${name}`
    );


    return NextResponse.json(
      { message: "Vendor Created Successfully!", vendor: newVendor },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create vendor", error },
      { status: 500 }
    );
  }
}
