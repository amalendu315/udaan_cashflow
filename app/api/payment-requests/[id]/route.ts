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
  const requestId = parseInt(id, 10);

  if (isNaN(requestId)) {
    return NextResponse.json(
      { message: "Invalid payment_request id" },
      { status: 400 }
    );
  }

  try {
    const query = `
      SELECT 
        pr.id, 
        pr.hotel_id, 
        h.name AS hotel_name, 
        pr.date, 
        pr.vendor_id, 
        v.name AS vendor_name, 
        pr.department, 
        pr.ledger_id, 
        l.name AS ledger_name, 
        pr.amount, 
        pr.due_date, 
        pr.approval_by, 
        pr.payment_group_id, 
        pg.name AS payment_group_name, 
        pr.remarks, 
        pr.status, 
        pr.attachment_1, 
        pr.attachment_2, 
        pr.attachment_3, 
        pr.created_by, 
        cu.username AS created_by_name, 
        pr.updated_by, 
        uu.username AS updated_by_name, 
        pr.created_at, 
        pr.updated_at
      FROM 
        payment_requests pr
      INNER JOIN 
        hotels h ON pr.hotel_id = h.id
      INNER JOIN 
        vendors v ON pr.vendor_id = v.id
      INNER JOIN 
        monthly_payment_ledgers l ON pr.ledger_id = l.id
      LEFT JOIN 
        payment_groups pg ON pr.payment_group_id = pg.id
      LEFT JOIN 
        users cu ON pr.created_by = cu.id
      LEFT JOIN 
        users uu ON pr.updated_by = uu.id
      WHERE 
        pr.id = @requestId;
    `;

    const result = await dbQuery(pool, query, { requestId });

    if (!result.recordset.length) {
      return NextResponse.json(
        { message: "Payment Request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch payment request", error },
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
    "Sub-Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const action = "Update Payment Request";
  const { id } = await context.params;
  const requestId = parseInt(id, 10);

  if (isNaN(requestId)) {
    return NextResponse.json(
      { message: "Invalid Payment request id" },
      { status: 400 }
    );
  }

  const payload = await req.json();
  const dbInput = {
    id: requestId,
    hotel_id: payload.hotel_id,
    date: payload.date,
    vendor_id: payload.vendor_id, // Updated to use vendor_id
    department: payload.department,
    ledger_id: payload.ledger_id, // Updated to use ledger_id
    amount: payload.amount,
    due_date: payload.due_date,
    approval_by: payload.approval_by,
    payment_group_id: payload.payment_group_id,
    remarks: payload.remarks,
    status: payload.status,
    updated_by: user?.id,
  };

  const pool = await connectDb();

  try {
    const query = `
      UPDATE payment_requests
      SET hotel_id = @hotel_id, 
          date = @date, 
          vendor_id = @vendor_id, 
          department = @department, 
          ledger_id = @ledger_id, 
          amount = @amount, 
          due_date = @due_date, 
          approval_by = @approval_by, 
          payment_group_id = @payment_group_id, 
          remarks = @remarks, 
          status = @status, 
          updated_by = @updated_by, 
          updated_at = GETDATE()
      WHERE id = @id;
    `;

    const result = await dbQuery(pool, query, dbInput);

    if (!result.rowsAffected[0]) {
      return NextResponse.json(
        { message: "Payment Request not found" },
        { status: 404 }
      );
    }

    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "payment_requests",
      action,
      `Updated payment request with id: ${requestId}`
    );

    return NextResponse.json(
      { message: "Payment Request updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update payment request", error },
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

  const action = "Delete Payment Request";
  const { id } = await context.params;
  const requestId = parseInt(id, 10);

  if (isNaN(requestId)) {
    return NextResponse.json(
      { message: "Invalid Payment request id" },
      { status: 400 }
    );
  }

  const pool = await connectDb();

  try {
    const query = `DELETE FROM payment_requests WHERE id = @id`;
    const result = await dbQuery(pool, query, { id: requestId });

    if (!result.rowsAffected[0]) {
      return NextResponse.json(
        { message: "Payment Request not found" },
        { status: 404 }
      );
    }

    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "payment_requests",
      action,
      `Deleted Payment Request with id: ${requestId}`
    );

    return NextResponse.json(
      { message: "Payment Request deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete payment request", error },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { isAuthorized, user } = await verifyAuth(req, [
    "Admin",
    "Sub-Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const action = "Update Payment Request Status";
  const { id } = await context.params;
  const requestId = parseInt(id, 10);

  if (isNaN(requestId)) {
    return NextResponse.json(
      { message: "Invalid Payment request id" },
      { status: 400 }
    );
  }

  const { status, remarks } = await req.json();
  const pool = await connectDb();

  try {
    const query = `SELECT status FROM payment_requests WHERE id = @id`;
    const result = await dbQuery(pool, query, { id: requestId });

    if (!result.recordsets.length) {
      return NextResponse.json(
        { message: "Payment Request not found" },
        { status: 404 }
      );
    }

    const prevStatus = result.recordset[0].status;

    const updateQuery = `
      UPDATE payment_requests
      SET status = @status, 
          remarks = @remarks, 
          updated_by = @updated_by, 
          updated_at = GETDATE()
      WHERE id = @id;
    `;

    const dbInput = {
      id: requestId,
      status,
      remarks,
      updated_by: user?.id,
    };

    const updateResult = await dbQuery(pool, updateQuery, dbInput);

    if (!updateResult.rowsAffected[0]) {
      return NextResponse.json(
        { message: "Failed to update payment request status" },
        { status: 404 }
      );
    }

    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "payment_requests",
      action,
      JSON.stringify({ id: requestId, oldStatus: prevStatus, status, remarks })
    );

    return NextResponse.json(
      { message: `Payment request status changed successfully.` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { message: "Error processing request.", error: error },
      { status: 500 }
    );
  }
}
