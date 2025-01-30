import { NextRequest, NextResponse } from "next/server";

// Local Imports
import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares/verify-auth";

export async function GET(req: NextRequest) {
  const { isAuthorized, message } = await verifyAuth(req, [
    "Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 401 });
  }
  const pool = await connectDb();

  try {
    const query = `
      SELECT 
        cl.id,
        FORMAT(cl.created_at, 'yyyy-MM-dd HH:mm:ss') AS created_at,
        cl.role,
        cl.table_name,
        cl.action,
        cl.details,
        cl.user_id,
        u.username AS user_name, -- Fetch user details
        u.email AS user_email
      FROM 
        cache_logs cl
      LEFT JOIN 
        users u ON cl.user_id = u.id -- Join with the users table
      ORDER BY 
        cl.created_at ASC;
    `;

    const result = await pool.request().query(query);

    return NextResponse.json(result.recordset, { status: 200 });
  } catch (error) {
    console.error("Error fetching cache logs:", error);
    return NextResponse.json(
      { message: "Error fetching cache logs", error },
      { status: 500 }
    );
  }
}
