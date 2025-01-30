import { NextRequest, NextResponse } from "next/server";

import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
import { dbQuery, logAction } from "@/utils";
import { CreateVendorRequest } from "@/types";

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
  const vendorId = parseInt(id, 10);

  if (isNaN(vendorId)) {
    return NextResponse.json({ message: "Invalid vendor id" }, { status: 400 });
  }

  try {
    const query = `SELECT id, name, phone, email, location, description FROM vendors WHERE id = @vendorId`;
    const result = await dbQuery(pool, query, { vendorId });

    if (!result.recordset.length) {
      return NextResponse.json(
        { message: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch vendor", error },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { isAuthorized, user, message } = await verifyAuth(req, [
    "Admin",
    "System-Admin",
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const action = "Update Vendor";
  const { id } = await context.params;
  const vendorId = parseInt(id, 10);
  const { name, location, description, email, phone }: CreateVendorRequest =
    await req.json();

  if (isNaN(vendorId)) {
    return NextResponse.json({ message: "Invalid vendor id" }, { status: 400 });
  }

  const pool = await connectDb();

  try {
    const query = `
      UPDATE vendors 
      SET name = @name, phone = @phone, email = @email, location = @location, description = @description, updated_at = GETDATE()
      OUTPUT INSERTED.*
      WHERE id = @vendorId
    `;
    const result = await dbQuery(pool, query, {
      name,
      phone,
      email,
      location,
      description,
      vendorId,
    });

    if (!result.recordset.length) {
      return NextResponse.json(
        { message: "Vendor not found" },
        { status: 404 }
      );
    }

    const updatedVendor = result.recordset[0];

    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "vendors",
      action,
      `Updated vendor with name: ${name}`
    );


    return NextResponse.json(
      { message: "Vendor updated successfully", vendor: updatedVendor },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update vendor", error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { isAuthorized, user, message } = await verifyAuth(req, [
    "Admin",
    "System-Admin",
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const action = "Delete Vendor";
  const { id } = await context.params;
  const vendorId = parseInt(id, 10);

  if (isNaN(vendorId)) {
    return NextResponse.json({ message: "Invalid vendor id" }, { status: 400 });
  }

  const pool = await connectDb();

  try {
    const query = `
      DELETE FROM vendors 
      OUTPUT DELETED.id
      WHERE id = @vendorId
    `;
    const result = await dbQuery(pool, query, { vendorId });

    if (!result.recordset.length) {
      return NextResponse.json(
        { message: "Vendor not found" },
        { status: 404 }
      );
    }

    const deletedVendorId = result.recordset[0].id;

    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "vendors",
      action,
      `Deleted vendor with id: ${vendorId}`
    );


    return NextResponse.json(
      { message: "Vendor deleted successfully", vendorId: deletedVendorId },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete vendor", error },
      { status: 500 }
    );
  }
}
