import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";

import { connectDb } from "@/db/config";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const pool = await connectDb();

  if (!date) {
    return NextResponse.json(
      { message: "Date parameter is required." },
      { status: 400 }
    );
  }

  try {
    // Fetch detailed payment requests
    const paymentRequests = await pool.request().input("date", sql.Date, date)
      .query(`
          SELECT 
            pr.id,
            h.name AS hotel_name,
            v.name AS vendor_name, -- Fetch vendor name from vendors table
            d.name AS department_name, -- Fetch department name
            l.name AS ledger_name, -- Fetch ledger name from ledgers table
            pr.amount,
            FORMAT(pr.due_date, 'yyyy-MM-dd') AS due_date,
            pr.approval_by,
            pr.remarks,
            pr.status,
            u.username AS created_by, -- Fetch the username of the user who created the request
            FORMAT(pr.created_at, 'yyyy-MM-dd HH:mm:ss') AS created_at
          FROM 
            payment_requests pr
          INNER JOIN 
            hotels h ON pr.hotel_id = h.id
          INNER JOIN 
            hotel_departments d ON pr.department = d.id -- Join with departments table
          INNER JOIN 
            vendors v ON pr.vendor_id = v.id -- Join with vendors table
          LEFT JOIN 
            monthly_payment_ledgers l ON pr.ledger_id = l.id -- Join with ledgers table
          LEFT JOIN 
            users u ON pr.created_by = u.id -- Join with users table to fetch username
          WHERE 
            FORMAT(pr.due_date, 'yyyy-MM-dd') = FORMAT(@date, 'yyyy-MM-dd')
            AND (
              pr.status IN ('Transfer Pending', 'Transfer Completed') -- Check for specific statuses
              OR u.role_id IN (1, 2) -- Automatically include if role_id is 1 (system-admin) or 2 (admin)
            );
      `);

    // Fetch detailed monthly payments with ledger details
    const monthlyPayments = await pool.request().input("date", sql.Date, date)
      .query(`
        SELECT 
  mp.id,
  h.name AS hotel_name,
  mp.amount,
  mp.payment_status,
  mp.day_of_month,
  FORMAT(DATEFROMPARTS(YEAR(@date), MONTH(@date), mp.day_of_month), 'yyyy-MM-dd') AS payment_date,
  mp.ledger_id,
  l.name AS ledger_name,
  FORMAT(mp.created_at, 'yyyy-MM-dd HH:mm:ss') AS created_at
FROM 
  monthly_payments mp
INNER JOIN 
  hotels h ON mp.hotel_id = h.id
LEFT JOIN 
  monthly_payment_ledgers l ON mp.ledger_id = l.id
WHERE 
  DATEFROMPARTS(YEAR(@date), MONTH(@date), mp.day_of_month) = @date;
      `);

    // Fetch detailed scheduled payments with ledger details
    const scheduledPayments = await pool.request().input("date", sql.Date, date)
      .query(`
        SELECT 
          sp.id,
          h.name AS hotel_name,
          sp.total_amount AS amount,
          sp.payment_term,
          sp.payment_status,
          sp.EMI,
          sp.ledger_id,
          l.name AS ledger_name,
          FORMAT(sp.date, 'yyyy-MM-dd') AS payment_date,
          FORMAT(sp.created_at, 'yyyy-MM-dd HH:mm:ss') AS created_at
        FROM 
          scheduled_payments sp
        INNER JOIN 
          hotels h ON sp.hotel_id = h.id
        LEFT JOIN 
          monthly_payment_ledgers l ON sp.ledger_id = l.id
        WHERE 
          FORMAT(sp.date, 'yyyy-MM-dd') = FORMAT(@date, 'yyyy-MM-dd');
      `);

    return NextResponse.json({
      paymentRequests: paymentRequests.recordset,
      monthlyPayments: monthlyPayments.recordset,
      scheduledPayments: scheduledPayments.recordset,
    });
  } catch (error) {
    console.error("Error fetching payment breakdown:", error);
    return NextResponse.json(
      { message: "Error fetching payment breakdown.", error },
      { status: 500 }
    );
  }
}
