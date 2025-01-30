import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

import { connectDb } from "@/db/config";
import { dbQuery } from "@/utils";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { username, password } = await req.json();
  const pool = await connectDb();
  try {
    const query = `SELECT u.id, u.username, u.email, u.password, u.hotel_id, h.name AS hotel_name, u.role_id, r.role_name
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      INNER JOIN hotels h ON u.hotel_id = h.id
      WHERE u.username = @username`;
    const result = await dbQuery(pool, query, {username});
    const user = result?.recordset[0];
    if(!user){
        return new NextResponse("User not found", { status: 404 });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if(!isValidPassword){
        return NextResponse.json(
            {message:"Invalid Credentials"},
            {status: 401}
        )
    }
    const token = jwt.sign(
      { id: user.id, role: user.role_name, hotelId: user.hotel_id, username:user?.username },
      process.env.JWT_SECRET!,
      { expiresIn: "12h" }
    );
    const maxAge = 12 * 60 * 60; // 12 hours in seconds

    // Return both token and user data, including hotel_name
    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role_name,
          hotel_id: user.hotel_id,
          hotel_name: user.hotel_name,
        },
      },
      {
        headers: {
          "Set-Cookie": `auth_token=${token}; Path=/; HttpOnly; Secure; Max-Age=${maxAge}; SameSite=Strict`,
        },
      }
    );
  } catch (error) {
    console.log((error as Error)?.message)
    return NextResponse.json(
        { message: "Error logging in" },
        { status: 500 }
        );
  }
}
