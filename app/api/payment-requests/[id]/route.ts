import { NextRequest, NextResponse } from "next/server";

import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
import { dbQuery, logAction, uploadToS3 } from "@/utils";
import sql from 'mssql';

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

// export async function POST(
//   req: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   const { isAuthorized, user } = await verifyAuth(req, [
//     "Admin",
//     "Sub-Admin",
//     "System-Admin",
//   ]);
//   if (!isAuthorized) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const action = "Update Payment Request Status";
//   const { id } = await context.params;
//   const requestId = parseInt(id, 10);

//   if (isNaN(requestId)) {
//     return NextResponse.json(
//       { message: "Invalid Payment request id" },
//       { status: 400 }
//     );
//   }

//   const { status, remarks } = await req.json();
//   const pool = await connectDb();

//   try {
//     const transaction = pool.transaction();
//     await transaction.begin();
//     const query = `SELECT due_date, status FROM payment_requests WHERE id = @id`;
//     const result = await dbQuery(pool, query, { id: requestId });

//     if (!result.recordsets.length) {
//       return NextResponse.json(
//         { message: "Payment Request not found" },
//         { status: 404 }
//       );
//     }

//     const prevStatus = result.recordset[0].status;
//     const prevDueDate = result.recordset[0].due_date;

//     const updateQuery = `
//       UPDATE payment_requests
//       SET status = @status, 
//           remarks = @remarks, 
//           updated_by = @updated_by, 
//           updated_at = GETDATE()
//       WHERE id = @id;
//     `;

//     const dbInput = {
//       id: requestId,
//       status,
//       remarks,
//       updated_by: user?.id,
//     };

//     const updateResult = await dbQuery(pool, updateQuery, dbInput);

//     if (dbInput.status === "Transfer Completed") {
//       const updateCashflowQuery = `
//           MERGE INTO cashflow AS target
//           USING (
//             SELECT @due_date AS date, SUM(amount) AS total_payments
//             FROM payment_requests
//             WHERE status = 'Transfer Completed' AND FORMAT(due_date, 'yyyy-MM-dd') = FORMAT(@due_date, 'yyyy-MM-dd')
//             GROUP BY due_date
//           ) AS source
//           ON target.date = source.date
//           WHEN MATCHED THEN 
//             UPDATE SET target.total_payments = source.total_payments
//           WHEN NOT MATCHED THEN
//             INSERT (date, projected_inflow, actual_inflow, total_payments, closing, created_at, updated_at)
//             VALUES (source.date, 0, 0, source.total_payments, 0, GETDATE(), GETDATE());
//         `;

//       await transaction
//         .request()
//         .input("due_date", prevDueDate)
//         .query(updateCashflowQuery);
//     }

//     await transaction.commit();

//     if (!updateResult.rowsAffected[0]) {
//       return NextResponse.json(
//         { message: "Failed to update payment request status" },
//         { status: 404 }
//       );
//     }

//     await logAction(
//       pool,
//       user?.id || null,
//       user?.role || null,
//       "payment_requests",
//       action,
//       JSON.stringify({ id: requestId, oldStatus: prevStatus, status, remarks })
//     );

//     return NextResponse.json(
//       { message: `Payment request status changed successfully.` },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error processing request:", error);
//     return NextResponse.json(
//       { message: "Error processing request.", error: error },
//       { status: 500 }
//     );
//   }
// }

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // ✅ Step 1: Verify Authentication
  const { isAuthorized, user } = await verifyAuth(req, [
    "Admin",
    "Sub-Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { message: "Invalid Content-Type. Expected multipart/form-data." },
      { status: 400 }
    );
  }

  // ✅ Step 2: Extract & Validate Payment Request ID
  const { id } = await context.params;
  const requestId = parseInt(id, 10);
  if (isNaN(requestId)) {
    return NextResponse.json(
      { message: "Invalid Payment Request ID" },
      { status: 400 }
    );
  }

  // ✅ Step 3: Parse Form Data
  const formData = await req.formData();
  const status = formData.get("status") as string;
  const remarks = formData.get("remarks") as string;
  const paymentMethod = formData.get("payment_method") as string; // Cash or Bank Transfer
  const attachment = formData.get("attachment") as File | null;

  const pool = await connectDb();
  const transaction = pool.transaction();

  try {
    await transaction.begin();

    // ✅ Step 4: Retrieve Payment Request Details
    const paymentQuery = `
      SELECT due_date, status, amount
      FROM payment_requests
      WHERE id = @id;
    `;
    const paymentResult = await transaction
      .request()
      .input("id", sql.Int, requestId)
      .query(paymentQuery);

    if (!paymentResult.recordset.length) {
      return NextResponse.json(
        { message: "Payment Request not found" },
        { status: 404 }
      );
    }

    const { due_date, amount, status: prevStatus } = paymentResult.recordset[0];

    // ✅ Step 5: Fetch Last Closing Balance Before Payment Date
    const closingQuery = `
      SELECT TOP 1 closing 
      FROM cashflow 
      WHERE date < @due_date 
      ORDER BY date DESC;
    `;
    const closingResult = await transaction
      .request()
      .input("due_date", sql.Date, due_date)
      .query(closingQuery);

    const lastClosing = closingResult.recordset.length
      ? closingResult.recordset[0].closing
      : 0; // Default to 0 if no prior closing exists

    // ✅ Step 6: Check Actual Inflow for the Due Date
    const inflowQuery = `
      SELECT COALESCE(SUM(amount), 0) AS actual_inflow 
      FROM actual_inflow 
      WHERE date = @due_date;
    `;
    const inflowResult = await transaction
      .request()
      .input("due_date", sql.Date, due_date)
      .query(inflowQuery);

    const actualInflow = inflowResult.recordset[0].actual_inflow;

    // ❌ Step 7: Validate Approval Restrictions
    if (actualInflow === 0) {
      return NextResponse.json(
        { message: `Approval blocked! No actual inflow for ${due_date}.` },
        { status: 400 }
      );
    }

    if (amount > lastClosing + actualInflow) {
      return NextResponse.json(
        {
          message: `Approval blocked! Amount exceeds available balance (₹${lastClosing}).`,
        },
        { status: 400 }
      );
    }

    // ✅ Step 8: Handle File Upload
    let attachmentUrl = null;
    if (attachment) {
      attachmentUrl = await uploadToS3(
        attachment,
        `payment_proofs/${requestId}`
      );
    }

    console.log("attachmentUrl", attachmentUrl);

    // ✅ Step 9: Update Payment Request
    const updateQuery = `
      UPDATE payment_requests
      SET status = @status, 
          remarks = @remarks, 
          payment_method = @paymentMethod,
          attachment_4 = @attachmentUrl, 
          updated_by = @updated_by, 
          updated_at = GETDATE()
      WHERE id = @id;
    `;

    await transaction
      .request()
      .input("id", sql.Int, requestId)
      .input("status", sql.VarChar, status)
      .input("remarks", sql.VarChar, remarks || null)
      .input("paymentMethod", sql.VarChar, paymentMethod)
      .input("attachmentUrl", sql.VarChar, attachmentUrl || null)
      .input("updated_by", sql.Int, user?.id)
      .query(updateQuery);

    await transaction.commit();

    // ✅ Step 10: Log Action
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "payment_requests",
      "Update Payment Request Status",
      JSON.stringify({
        id: requestId,
        oldStatus: prevStatus,
        newStatus: status,
        paymentMethod,
        remarks,
        attachmentUrl,
      })
    );

    return NextResponse.json(
      { message: `Payment request status updated successfully.` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    await transaction.rollback();
    return NextResponse.json(
      { message: "Error processing request.", error },
      { status: 500 }
    );
  }
}


