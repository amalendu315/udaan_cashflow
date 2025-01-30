import { NextRequest, NextResponse } from "next/server";

import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
import { dbQuery, logAction } from "@/utils";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { isAuthorized, message } = await verifyAuth(req, [
    "Admin",
    "Sub-Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }
  const hotelId = parseInt((await props.params).id, 10);
  if (isNaN(hotelId)) {
    return NextResponse.json({ message: "Invalid hotel id" }, { status: 400 });
  }
  const pool = await connectDb();
  try {
    const query = `SELECT * FROM hotels WHERE Id = @hotelId`;
    const result = await dbQuery(pool, query, { hotelId });
    if (!result.recordset.length) {
      return NextResponse.json({ message: "Hotel not found" }, { status: 404 });
    }
    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch hotel", error },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { isAuthorized, user, message } = await verifyAuth(req, [
    "Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }
  const action = "Update Hotel";
  const hotelId = parseInt((await props.params).id, 10);
  const { name, location, description } = await req.json();
  if (isNaN(hotelId)) {
    return NextResponse.json({ message: "Invalid hotel id" }, { status: 400 });
  }
  const pool = await connectDb();
  try {
    const query = `UPDATE hotels SET name = @name, location = @location, description = @description, updated_at = GETDATE() WHERE Id = @hotelId`;
    const result = await dbQuery(pool, query, {
      name,
      location,
      description,
      hotelId,
    });
    if (!result.rowsAffected[0]) {
      return NextResponse.json({ message: "Hotel not found" }, { status: 404 });
    }
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "hotels",
      action,
      `Updated hotel with name: ${name}`
    );
    return NextResponse.json(
      { message: "Hotel updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update hotel", error },
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
    return NextResponse.json({ message }, { status: 403 });
  }
  const action = "Delete Hotel";
  const hotelId = parseInt((await props.params).id, 10);
  if (isNaN(hotelId)) {
    return NextResponse.json({ message: "Invalid hotel id" }, { status: 400 });
  }
  const pool = await connectDb();
  try {
    const query = `DELETE FROM hotels WHERE Id = @hotelId`;
    const result = await dbQuery(pool, query, { hotelId });
    if (!result.rowsAffected[0]) {
      return NextResponse.json({ message: "Hotel not found" }, { status: 404 });
    }
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "hotels",
      action,
      `Deleted hotel with id: ${hotelId}`
    );
    return NextResponse.json(
      { message: "Hotel deleted successfully" },
      { status: 200 }
      );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete hotel", error },
      { status: 500 }
    );
  }
}
