//import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
import { dbQuery, logAction } from "@/utils";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { isAuthorized, message } = await verifyAuth(req, [
    "Admin",
    "Sub-Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const userId = parseInt(context.params.id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
  }

  const pool = await connectDb();
  try {
    const query = `
      SELECT 
        u.id, u.username, u.email, u.role_id, r.role_name,
        STRING_AGG(h.id, ',') AS hotel_ids, 
        STRING_AGG(h.name, ', ') AS hotel_names
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      LEFT JOIN user_hotels uh ON u.id = uh.user_id
      LEFT JOIN hotels h ON uh.hotel_id = h.id
      WHERE u.id = @id
      GROUP BY u.id, u.username, u.email, u.role_id, r.role_name
    `;

    const result = await dbQuery(pool, query, { id: userId });

    if (result.recordset.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const user = result.recordset[0];

    return NextResponse.json({
      ...user,
      hotel_ids: user.hotel_ids ? user.hotel_ids.split(",").map(Number) : [],
      hotel_names: user.hotel_names ? user.hotel_names.split(", ") : [],
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
  context: { params: { id: string } }
) {
  const { isAuthorized, message, user } = await verifyAuth(req, [
    "Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const userId = await parseInt(context.params.id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
  }

  const { username, email, role_id, hotels } = await req.json();

  console.log(username, email, userId, role_id, hotels);
  

  if (!Array.isArray(hotels) || hotels.length === 0) {
    return NextResponse.json(
      { message: "At least one hotel must be assigned." },
      { status: 400 }
    );
  }

  const pool = await connectDb();
  try {
    // ✅ Update User Details
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

    // ✅ Remove Existing Hotel Assignments
    await dbQuery(pool, `DELETE FROM user_hotels WHERE user_id = @id`, {
      id: userId,
    });

    // ✅ Insert New Hotel Assignments
    for (const hotelId of hotels) {
      await dbQuery(
        pool,
        `INSERT INTO user_hotels (user_id, hotel_id) VALUES (@userId, @hotelId)`,
        { userId, hotelId }
      );
    }

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
  context: { params: { id: string } }
) {
  const { isAuthorized, user, message } = await verifyAuth(req, [
    "Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const userId = parseInt(context.params.id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ message: "Invalid User ID" }, { status: 400 });
  }

  const pool = await connectDb();
  try {
    // ✅ Remove user-hotel associations first
    await dbQuery(pool, `DELETE FROM user_hotels WHERE user_id = @id`, {
      id: userId,
    });

    // ✅ Delete user
    const deleteUserQuery = `DELETE FROM users WHERE id = @id`;
    const result = await dbQuery(pool, deleteUserQuery, { id: userId });

    if (!result.rowsAffected[0]) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

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

