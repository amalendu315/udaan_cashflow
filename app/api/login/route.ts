import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

import { connectDb } from "@/db/config";
import { dbQuery } from "@/utils";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { username, password } = await req.json();
  const pool = await connectDb();

  try {
    const query = `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.password, 
        u.role_id, 
        r.role_name,
        STRING_AGG(h.id, ',') AS hotel_ids,  -- Get all hotel IDs as a comma-separated string
        STRING_AGG(h.name, ',') AS hotel_names  -- Get all hotel names as a comma-separated string
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      INNER JOIN user_hotels uh ON u.id = uh.user_id  -- Join with the user_hotels table
      INNER JOIN hotels h ON uh.hotel_id = h.id
      WHERE u.username = @username
      GROUP BY u.id, u.username, u.email, u.password, u.role_id, r.role_name;
    `;

    const result = await dbQuery(pool, query, { username });
    const user = result?.recordset[0];

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Invalid Credentials" },
        { status: 401 }
      );
    }

    // Convert hotel_ids and hotel_names from comma-separated strings to arrays
    const hotelIds = user.hotel_ids
      ? user.hotel_ids.split(",").map(Number)
      : [];
    const hotelNames = user.hotel_names ? user.hotel_names.split(",") : [];

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role_name,
        hotelIds, // Now an array
        username: user.username,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "2h" }
    );

    const maxAge = 2 * 60 * 60; // 2 hours in seconds

    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role_id:user?.role_id,
          role: user.role_name,
          hotel_ids: hotelIds, // Now an array
          hotel_names: hotelNames, // Now an array
        },
      },
      {
        headers: {
          "Set-Cookie": `auth_token=${token}; Path=/; HttpOnly; Secure; Max-Age=${maxAge}; SameSite=Strict`,
        },
      }
    );
  } catch (error) {
    console.error((error as Error)?.message);
    return NextResponse.json({ message: "Error logging in" }, { status: 500 });
  }
}
