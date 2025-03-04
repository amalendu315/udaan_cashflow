//import bcrypt from "bcryptjs";
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
    "System-Admin",
    "Sub-Admin",
    "User",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const { id } = await context.params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
  }

  const pool = await connectDb();
  try {
    const query = `
      SELECT 
    u.id, 
    u.username, 
    u.email, 
    u.role_id, 
    r.role_name,
    STRING_AGG(CONCAT(h.id, ':', h.name), ',') AS hotel_data,
    (
        SELECT STRING_AGG(CONCAT(ua.approver_id, ':', COALESCE(a.username, 'Unknown')), ',')
        FROM user_approvers ua
        LEFT JOIN users a ON ua.approver_id = a.id
        WHERE ua.user_id = u.id
    ) AS approver_data
FROM users u
INNER JOIN roles r ON u.role_id = r.id
LEFT JOIN user_hotels uh ON u.id = uh.user_id
LEFT JOIN hotels h ON uh.hotel_id = h.id
WHERE u.id = @id
GROUP BY u.id, u.username, u.email, u.role_id, r.role_name;


    `;

    const result = await dbQuery(pool, query, { id: userId });

    if (result.recordset.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const user = result.recordset[0];

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role_name,
      hotels: user.hotel_data
        ? user.hotel_data.split(",").map((h: string) => {
            const [hotelId, hotelName] = h.split(":");
            return { id: Number(hotelId), name: hotelName };
          })
        : [],
      approvers: user.approver_data
        ? user.approver_data
            .split(",")
            .map((a: string) => {
              const [approverId, approverName] = a.split(":");
              return {
                id: Number(approverId) || null, // ✅ Ensure correct number format
                name: approverName || "Unknown", // ✅ Ensure name exists
              };
            })
            .filter((approver:{id:number, name:string}) => approver.id !== null) // ✅ Remove invalid IDs
        : [],
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching user details", error },
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
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const { id } = await context.params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
  }

  const { username, email, role_id, hotels, approvers } = await req.json();

  if (!Array.isArray(hotels) || hotels.length === 0) {
    return NextResponse.json(
      { message: "At least one hotel must be assigned." },
      { status: 400 }
    );
  }

  const pool = await connectDb();
  try {
    // ✅ Step 1: Update User Details
    const updateUserQuery = `
      UPDATE users SET
        username = @username,
        email = @email,
        role_id = @role_id,
        updated_at = GETDATE()
      WHERE id = @id
    `;
    await dbQuery(pool, updateUserQuery, {
      id: userId,
      username,
      email,
      role_id,
    });

    // ✅ Step 2: Remove Existing Hotel Assignments
    await dbQuery(pool, `DELETE FROM user_hotels WHERE user_id = @id`, {
      id: userId,
    });

    // ✅ Step 3: Insert New Hotel Assignments
    for (const hotelId of hotels) {
      await dbQuery(
        pool,
        `INSERT INTO user_hotels (user_id, hotel_id) VALUES (@userId, @hotelId)`,
        { userId, hotelId }
      );
    }

    // ✅ Step 4: Remove Previous Approvers
    await dbQuery(pool, `DELETE FROM user_approvers WHERE user_id = @id`, {
      id: userId,
    });

    // ✅ Step 5: Insert New Approvers
    if (Array.isArray(approvers) && approvers.length > 0) {
      for (const approverId of approvers) {
        await dbQuery(
          pool,
          `INSERT INTO user_approvers (user_id, approver_id) VALUES (@userId, @approverId)`,
          { userId, approverId }
        );
      }
    }

    // ✅ Step 6: Log Action
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "users",
      "Update User",
      `Updated user with ID ${userId}`
    );

    return NextResponse.json(
      { message: "User updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error updating user", error },
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

  const { id } = await context.params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ message: "Invalid User ID" }, { status: 400 });
  }

  const pool = await connectDb();
  try {
    // ✅ Step 1: Remove user from `user_approvers`
    await dbQuery(
      pool,
      `DELETE FROM user_approvers WHERE user_id = @id OR approver_id = @id`,
      {
        id: userId,
      }
    );

    // ✅ Step 2: Remove user-hotel associations
    await dbQuery(pool, `DELETE FROM user_hotels WHERE user_id = @id`, {
      id: userId,
    });

    // ✅ Step 3: Delete user
    const deleteUserQuery = `DELETE FROM users WHERE id = @id`;
    const result = await dbQuery(pool, deleteUserQuery, { id: userId });

    if (!result.rowsAffected || result.rowsAffected < 1) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // ✅ Step 4: Log action
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "users",
      "Delete User",
      `Deleted user with ID ${userId}`
    );

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error deleting user", error },
      { status: 500 }
    );
  }
}


