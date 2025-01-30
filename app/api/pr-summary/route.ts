import { NextRequest, NextResponse } from "next/server";

// Local Imports
import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";

export async function GET(req: NextRequest) {
  const { isAuthorized, user, message } = await verifyAuth(req, [
    "Admin",
    "System-Admin",
    "Sub-Admin",
    "User",
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ message, status: 401 });
  }

  const pool = await connectDb();

  try {
    let queries = {
      pending_payments: "",
      transfer_pending: "",
      approved_payments: "",
      rejected_payments: "",
    };

    const queryParams: Record<string, unknown> = {};

    // Build queries based on user role
    if (["Admin", "System-Admin"].includes(user?.role || "")) {
      // Admin/System-Admin: View all payment requests
      queries = {
        pending_payments: `
          SELECT COUNT(*) AS count 
          FROM payment_requests 
          WHERE status = 'Pending'`,
        transfer_pending: `
          SELECT COUNT(*) AS count 
          FROM payment_requests 
          WHERE status = 'Transfer Pending'`,
        approved_payments: `
          SELECT COUNT(*) AS count 
          FROM payment_requests 
          WHERE status = 'Transfer Completed'`,
        rejected_payments: `
          SELECT COUNT(*) AS count 
          FROM payment_requests 
          WHERE status = 'Rejected'`,
      };
    } else if (user?.role === "Sub-Admin") {
      // Sub-Admin: View payment requests they are requested to approve
      queries = {
        pending_payments: `
          SELECT COUNT(*) AS count 
          FROM payment_requests 
          WHERE status = 'Pending' 
            AND approval_by = @approval_by`,
        transfer_pending: `
          SELECT COUNT(*) AS count 
          FROM payment_requests 
          WHERE status = 'Transfer Pending' 
            AND approval_by = @approval_by`,
        approved_payments: `
          SELECT COUNT(*) AS count 
          FROM payment_requests 
          WHERE status = 'Transfer Completed' 
            AND approval_by = @approval_by`,
        rejected_payments: `
        SELECT COUNT(*) AS count
        FROM payment_requests
        WHERE status = 'Rejected'
          AND approval_by = @approval_by`,
      };
      queryParams.approval_by = user?.username;
    } else if (user?.role === "User") {
      // Regular User: View payment requests they created
      queries = {
        pending_payments: `
          SELECT COUNT(*) AS count 
          FROM payment_requests 
          WHERE status = 'Pending' 
            AND created_by = @created_by`,
        transfer_pending: `
          SELECT COUNT(*) AS count 
          FROM payment_requests 
          WHERE status = 'Transfer Pending' 
            AND created_by = @created_by`,
        approved_payments: `
          SELECT COUNT(*) AS count 
          FROM payment_requests 
          WHERE status = 'Transfer Completed' 
            AND created_by = @created_by`,
        rejected_payments: `
        SELECT COUNT(*) AS count
        FROM payment_requests
        WHERE status = 'Rejected'
          AND created_by = @created_by`,
      };
      queryParams.created_by = user?.id;
    }

    // Execute all queries in parallel
    const [
      pendingPaymentsResult,
      transferPendingResult,
      approvedPaymentsResult,
      rejectedPaymentsResult,
    ] = await Promise.all([
      pool
        .request()
        .input("approval_by", queryParams.approval_by || null)
        .input("created_by", queryParams.created_by || null)
        .query(queries.pending_payments),
      pool
        .request()
        .input("approval_by", queryParams.approval_by || null)
        .input("created_by", queryParams.created_by || null)
        .query(queries.transfer_pending),
      pool
        .request()
        .input("approval_by", queryParams.approval_by || null)
        .input("created_by", queryParams.created_by || null)
        .query(queries.approved_payments),
      pool
        .request()
        .input("approval_by", queryParams.approval_by || null)
        .input("created_by", queryParams.created_by || null)
        .query(queries.rejected_payments),
    ]);

    // Prepare the response object
    const response = {
      pendingPayments: pendingPaymentsResult.recordset[0]?.count || 0,
      transferPending: transferPendingResult.recordset[0]?.count || 0,
      approvedPayments: approvedPaymentsResult.recordset[0]?.count || 0,
      rejectedPayments: rejectedPaymentsResult.recordset[0]?.count || 0,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching user payment summary:", error);
    return NextResponse.json(
      { message: "Error fetching user payment summary", error },
      { status: 500 }
    );
  }
}
