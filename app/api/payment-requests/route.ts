import { NextRequest, NextResponse } from "next/server";

import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
import { dbQuery, logAction, uploadToS3 } from "@/utils";


export async function GET(req: NextRequest): Promise<NextResponse> {
  const { isAuthorized, user, message } = await verifyAuth(req, [
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
    let query;
    const queryParams: Record<string, unknown> = {};

    if (user?.role === "Admin" || user?.role === "System-Admin") {
      query = `
        SELECT 
          pr.id AS id, 
          h.name AS hotel_name, 
          FORMAT(pr.date, 'yyyy-MM-dd') AS date, 
          v.name AS vendor_name, -- Fetching vendor_name from vendors table
          pr.vendor_id, -- Including vendor_id
          hd.name AS department_name, 
          l.name AS ledger_name, -- Fetching ledger_name from ledgers table
          pr.ledger_id, -- Including ledger_id
          pr.amount, 
          FORMAT(pr.due_date, 'yyyy-MM-dd') AS due_date, 
          pg.name AS payment_group_name, 
          pr.remarks, 
          pr.attachment_1, 
          pr.attachment_2, 
          pr.attachment_3, 
          pr.status, 
          cu.username AS created_by_name, 
          uu.username AS updated_by_name, 
          pr.approval_by
        FROM 
          payment_requests pr
        INNER JOIN 
          hotels h ON pr.hotel_id = h.id
        INNER JOIN 
          vendors v ON pr.vendor_id = v.id -- Joining vendors table
        INNER JOIN 
          monthly_payment_ledgers l ON pr.ledger_id = l.id -- Joining ledgers table
        LEFT JOIN 
          hotel_departments hd ON pr.department = hd.id
        LEFT JOIN 
          payment_groups pg ON pr.payment_group_id = pg.id
        LEFT JOIN 
          users cu ON pr.created_by = cu.id
        LEFT JOIN 
          users uu ON pr.updated_by = uu.id
        ORDER BY 
          pr.created_at DESC;
      `;
    } else if (user?.role === "Sub-Admin") {
      query = `
        SELECT 
          pr.id AS id, 
          h.name AS hotel_name, 
          FORMAT(pr.date, 'yyyy-MM-dd') AS date, 
          v.name AS vendor_name, 
          pr.vendor_id, 
          hd.name AS department_name, 
          l.name AS ledger_name, 
          pr.ledger_id, 
          pr.amount, 
          FORMAT(pr.due_date, 'yyyy-MM-dd') AS due_date, 
          pg.name AS payment_group_name, 
          pr.remarks, 
          pr.attachment_1, 
          pr.attachment_2, 
          pr.attachment_3, 
          pr.status, 
          cu.username AS created_by_name, 
          uu.username AS updated_by_name, 
          pr.approval_by
        FROM 
          payment_requests pr
        INNER JOIN 
          hotels h ON pr.hotel_id = h.id
        INNER JOIN 
          vendors v ON pr.vendor_id = v.id
        INNER JOIN 
          monthly_payment_ledgers l ON pr.ledger_id = l.id
        LEFT JOIN 
          hotel_departments hd ON pr.department = hd.id
        LEFT JOIN 
          payment_groups pg ON pr.payment_group_id = pg.id
        LEFT JOIN 
          users cu ON pr.created_by = cu.id
        LEFT JOIN 
          users uu ON pr.updated_by = uu.id
        WHERE 
          pr.approval_by = @approval_by
        ORDER BY 
          pr.created_at DESC;
      `;
      queryParams.approval_by = user?.username;
    } else if (user?.role === "User") {
      query = `
        SELECT 
          pr.id AS id, 
          h.name AS hotel_name, 
          FORMAT(pr.date, 'yyyy-MM-dd') AS date, 
          v.name AS vendor_name, 
          pr.vendor_id, 
          hd.name AS department_name, 
          l.name AS ledger_name, 
          pr.ledger_id, 
          pr.amount, 
          FORMAT(pr.due_date, 'yyyy-MM-dd') AS due_date, 
          pg.name AS payment_group_name, 
          pr.remarks, 
          pr.attachment_1, 
          pr.attachment_2, 
          pr.attachment_3, 
          pr.status, 
          cu.username AS created_by_name, 
          uu.username AS updated_by_name, 
          pr.approval_by
        FROM 
          payment_requests pr
        INNER JOIN 
          hotels h ON pr.hotel_id = h.id
        INNER JOIN 
          vendors v ON pr.vendor_id = v.id
        INNER JOIN 
          monthly_payment_ledgers l ON pr.ledger_id = l.id
        LEFT JOIN 
          hotel_departments hd ON pr.department = hd.id
        LEFT JOIN 
          payment_groups pg ON pr.payment_group_id = pg.id
        LEFT JOIN 
          users cu ON pr.created_by = cu.id
        LEFT JOIN 
          users uu ON pr.updated_by = uu.id
        WHERE 
          pr.created_by = @created_by
        ORDER BY 
          pr.created_at DESC;
      `;
      queryParams.created_by = user?.id;
    }

    const result = await dbQuery(pool, query as string, queryParams);
    return NextResponse.json(result.recordset);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch payment requests", error },
      { status: 500 }
    );
  }
}

// export async function POST(req: NextRequest): Promise<NextResponse> {
//   const { isAuthorized, message, user } = await verifyAuth(req, [
//     "Admin",
//     "Sub-Admin",
//     "User",
//     "System-Admin",
//   ]);
//   if (!isAuthorized) {
//     return NextResponse.json({ message }, { status: 403 });
//   }
//   const action = "Create Payment Request";
//   const formData = await req.formData();
//   const payload = {
//     hotel_id: Number(formData.get("hotel_id")),
//     date: formData.get("date") as string,
//     vendor_id: Number(formData.get("vendor_id")), // Updated to use vendor_id
//     department: formData.get("department_id") as string,
//     ledger_id: Number(formData.get("ledger_id")), // Updated to use ledger_id
//     amount: Number(formData.get("amount")),
//     due_date: formData.get("due_date") as string,
//     approval_by: formData.get("approval_by") as string,
//     payment_group_id: Number(formData.get("payment_group_id")) || null, // New Field
//     remarks: (formData.get("remarks") as string) || null,
//     attachment1: (formData.get("attachment1") as File) || null,
//     attachment2: (formData.get("attachment2") as File) || null,
//     attachment3: (formData.get("attachment3") as File) || null,
//   };

//   const attachmentUrls: Record<string, string | null> = {
//     attachment1: payload.attachment1
//       ? await uploadToS3(
//           payload.attachment1,
//           `attachment1-${Date.now()}`
//         )
//       : null,
//     attachment2: payload.attachment2
//       ? await uploadToS3(
//           payload.attachment2,
//           `attachment2-${Date.now()}`
//         )
//       : null,
//     attachment3: payload.attachment3
//       ? await uploadToS3(
//           payload.attachment3,
//           `attachment3-${Date.now()}`
//         )
//       : null,
//   };
//   const pool = await connectDb();

//   try {
//     const query = `
//       INSERT INTO payment_requests (
//           hotel_id, date, vendor_id, department, ledger_id, amount, due_date, approval_by, 
//           payment_group_id, remarks, attachment_1, attachment_2, attachment_3, created_by, 
//           created_at, updated_at
//         ) VALUES (
//           @hotel_id, @date, @vendor_id, @department, @ledger_id, @amount, @due_date, @approval_by, 
//           @payment_group_id, @remarks, @attachment_1, @attachment_2, @attachment_3, @created_by, 
//           GETDATE(), GETDATE()
//         )
//     `;

//     const dbInputs = {
//       hotel_id: payload.hotel_id,
//       date: payload.date,
//       vendor_id: payload.vendor_id,
//       department: payload.department,
//       ledger_id: payload.ledger_id,
//       amount: payload.amount,
//       due_date: payload.due_date,
//       approval_by: payload.approval_by,
//       payment_group_id: payload.payment_group_id,
//       remarks: payload.remarks,
//       attachment_1: attachmentUrls.attachment1,
//       attachment_2: attachmentUrls.attachment2,
//       attachment_3: attachmentUrls.attachment3,
//       created_by: user?.id,
//     };

//     const result = await dbQuery(pool, query, dbInputs);
//     await logAction(
//       pool,
//       user?.id || null,
//       user?.role || null,
//       "payment_requests",
//       action,
//       `Created payment request by user: ${user?.username}`
//     );
//     // const requestId = result.recordset[0]?.id;
//     return NextResponse.json(
//       { message: "Payment Request created successfully" },
//       { status: 201 }
//     );
//   } catch (error) {
//     return NextResponse.json(
//       { message: "Error creating payment request", error },
//       { status: 500 }
//     );
//   }
// }

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { isAuthorized, message, user } = await verifyAuth(req, [
    "Admin",
    "Sub-Admin",
    "User",
    "System-Admin",
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const action = "Create Payment Request";
  const formData = await req.formData();

  const payload = {
    hotel_id: Number(formData.get("hotel_id")),
    date: formData.get("date") as string,
    vendor_id: Number(formData.get("vendor_id")),
    department: formData.get("department_id") as string,
    ledger_id: Number(formData.get("ledger_id")),
    amount: Number(formData.get("amount")),
    due_date: formData.get("due_date") as string,
    approval_by: formData.get("approval_by") as string,
    payment_group_id: Number(formData.get("payment_group_id")) || null,
    remarks: (formData.get("remarks") as string) || null,
    attachment1: (formData.get("attachment1") as File) || null,
    attachment2: (formData.get("attachment2") as File) || null,
    attachment3: (formData.get("attachment3") as File) || null,
  };

  const attachmentUrls: Record<string, string | null> = {
    attachment1: payload.attachment1
      ? await uploadToS3(
          payload.attachment1,
          `attachment1-${Date.now()}`
        )
      : null,
    attachment2: payload.attachment2
      ? await uploadToS3(
          payload.attachment2,
          `attachment2-${Date.now()}`
        )
      : null,
    attachment3: payload.attachment3
      ? await uploadToS3(
          payload.attachment3,
          `attachment3-${Date.now()}`
        )
      : null,
  };

  const pool = await connectDb();

  try {
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      // Determine status based on the user's role
      const status = ["System-Admin", "Admin", "Sub-Admin"].includes(
        user?.role || ""
      )
        ? "Transfer Completed"
        : "Pending";

      // Insert Payment Request
     const insertPaymentRequestQuery = `
DECLARE @InsertedValues TABLE (id INT, due_date DATE);

INSERT INTO payment_requests (
    hotel_id, date, vendor_id, department, ledger_id, amount, due_date, approval_by, 
    payment_group_id, remarks, attachment_1, attachment_2, attachment_3, created_by, 
    status, created_at, updated_at
) 
OUTPUT INSERTED.id, INSERTED.due_date INTO @InsertedValues
VALUES (
    @hotel_id, @date, @vendor_id, @department, @ledger_id, @amount, @due_date, @approval_by, 
    @payment_group_id, @remarks, @attachment_1, @attachment_2, @attachment_3, @created_by, 
    @status, GETDATE(), GETDATE()
);

SELECT id, due_date FROM @InsertedValues;
`;

     const result = await transaction
       .request()
       .input("hotel_id", payload.hotel_id)
       .input("date", payload.date)
       .input("vendor_id", payload.vendor_id)
       .input("department", payload.department)
       .input("ledger_id", payload.ledger_id)
       .input("amount", payload.amount)
       .input("due_date", payload.due_date)
       .input("approval_by", payload.approval_by)
       .input("payment_group_id", payload.payment_group_id)
       .input("remarks", payload.remarks)
       .input("attachment_1", attachmentUrls.attachment1)
       .input("attachment_2", attachmentUrls.attachment2)
       .input("attachment_3", attachmentUrls.attachment3)
       .input("created_by", user?.id)
       .input("status", status)
       .query(insertPaymentRequestQuery);

    //  const paymentRequestId = result.recordset[0].id;
     const paymentDueDate = result.recordset[0].due_date;

      // If status is "Transfer Completed", update the cashflow table
      if (status === "Transfer Completed") {
        const updateCashflowQuery = `
          MERGE INTO cashflow AS target
          USING (
            SELECT @due_date AS date, SUM(amount) AS total_payments
            FROM payment_requests
            WHERE status = 'Transfer Completed' AND FORMAT(due_date, 'yyyy-MM-dd') = FORMAT(@due_date, 'yyyy-MM-dd')
            GROUP BY due_date
          ) AS source
          ON target.date = source.date
          WHEN MATCHED THEN 
            UPDATE SET target.total_payments = source.total_payments
          WHEN NOT MATCHED THEN
            INSERT (date, projected_inflow, actual_inflow, total_payments, closing, created_at, updated_at)
            VALUES (source.date, 0, 0, source.total_payments, 0, GETDATE(), GETDATE());
        `;

        await transaction
          .request()
          .input("due_date", paymentDueDate)
          .query(updateCashflowQuery);
      }

      await transaction.commit();

      // Log the action
      await logAction(
        pool,
        user?.id || null,
        user?.role || null,
        "payment_requests",
        action,
        `Created payment request by user: ${user?.username}`
      );

      return NextResponse.json(
        { message: "Payment Request created successfully" },
        { status: 201 }
      );
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error) {
    console.error("Error creating payment request:", error);
    return NextResponse.json(
      { message: "Error creating payment request", error },
      { status: 500 }
    );
  }
}