import { NextRequest, NextResponse } from "next/server";

import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
import { dbQuery, logAction } from "@/utils";
import { CreateHotelRequest } from "@/types";

export async function GET(req: NextRequest) {
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
    const query = `select Id, name, location, description, FORMAT(created_at, 'yyyy-MM-dd') AS created_at, FORMAT(updated_at, 'yyyy-MM-dd') AS updated_at from hotels order by Id asc`;
    const result = await dbQuery(pool, query);
    return NextResponse.json(result.recordset);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch hotels", error },
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
  const { name, location, description }: CreateHotelRequest = await req.json();
  const pool = await connectDb();
  try {
    const query = `Insert into hotels (name, location, description, created_at, updated_at) OUTPUT INSERTED.Id values (@name, @location, @description, GETDATE(), GETDATE())`;
    const result = await dbQuery(pool, query, { name, location, description });
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "hotels",
      "Create Hotel",
      `Created hotel with name: ${name}`
    );
    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create hotel", error },
      { status: 500 }
    );
  }
}