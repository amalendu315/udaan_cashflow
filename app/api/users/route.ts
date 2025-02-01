import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { connectDb } from '@/db/config';
import { verifyAuth } from '@/middlewares';
import { CreateUserRequest } from '@/types';
import { dbQuery, logAction } from '@/utils';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { isAuthorized, message } = await verifyAuth(req, [
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
    // Updated query to join with roles and hotels tables
    const query = `
            SELECT 
                u.Id, 
                u.username, 
                u.email, 
                u.created_at, 
                u.updated_at, 
                r.role_name AS role,  -- Get role name from roles table
                h.name AS hotel        -- Get hotel name from hotels table
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN hotels h ON u.hotel_id = h.id
        `;

    const result = await dbQuery(pool, query);

    return NextResponse.json(result.recordset);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch users", error },
      { status: 500 }
    );
  }
}


export async function POST(req:NextRequest):Promise<NextResponse>{
    const { isAuthorized, user, message } = await verifyAuth(req, [
      "Admin",
      "System-Admin",
    ]);
    if (!isAuthorized) {
        return NextResponse.json(
            { message },
            {status:403}
        );
    }
    const action = "Create User"
    const {username, password, email, role_id, hotel_id}:CreateUserRequest = await req.json();
    if(!username || !password || !email || isNaN(role_id) || isNaN(hotel_id)){
        return NextResponse.json(
            {message: "Invalid request"},
            {status:400}
            )
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = await connectDb();
    try {
        const query = `INSERT INTO users (username, password, email, role_id, hotel_id, created_at, updated_at)
         VALUES (@username, @password, @email, @role_id, @hotel_id, GETDATE(), GETDATE())`;
        const result = await dbQuery(pool, query, { username, password: hashedPassword, email, role_id, hotel_id });

        if(!result){
            return NextResponse.json(
                {message: "Failed to create user"},
                {status:500}
                )
        }

        await logAction(
            pool,
            user?.id || null,
            user?.role || null,
            "users",
            action,
            `Created User with username: ${username}`
        )
        return NextResponse.json(
            {message:"User Created Successfully!"},
            {status:201}
        )
    } catch (error) {
        return NextResponse.json(
            {message: "Failed to create user", error},
            {status:500}
            )
    }
}