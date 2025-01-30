import { NextResponse } from "next/server";

// Local Imports
import { connectDb } from "@/db/config";

export async function GET() {
  const pool = await connectDb();

  try {
    // Fetch Subadmins based on role_id (assuming role_id for Subadmin is 2)
    const systemAdminRoleId = 1; // Update this to match the actual role_id for Subadmin in your DB
    const adminRoleId = 2;
    const subadminRoleId = 3; // Update this to match the actual role_id for Subadmin in your DB
    const systemAdminResults = await pool.request().input("role_id", systemAdminRoleId)
      .query(`
        SELECT id, username, email 
        FROM users 
        WHERE role_id = @role_id
        ORDER BY username ASC;
      `);
    const adminResults = await pool
      .request()
      .input("role_id", adminRoleId).query(`
        SELECT id, username, email 
        FROM users 
        WHERE role_id = @role_id
        ORDER BY username ASC;
      `);
    const result = await pool.request().input("role_id", subadminRoleId).query(`
        SELECT id, username, email 
        FROM users 
        WHERE role_id = @role_id
        ORDER BY username ASC;
      `);

    // Combine results
    const combinedResults = [...systemAdminResults.recordset,...adminResults.recordset, ...result.recordset];

    // Return the fetched Subadmins
    return NextResponse.json(combinedResults, { status: 200 });
  } catch (error) {
    console.error("Error fetching Subadmins:", error);
    return NextResponse.json(
      { message: "Error fetching Subadmins", error: error },
      { status: 500 }
    );
  }
}
