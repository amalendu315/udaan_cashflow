import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

import { connectDb } from '@/db/config';
import { verifyAuth } from '@/middlewares';
import { CreateUserRequest } from '@/types';
import { dbQuery, logAction } from '@/utils';

interface User {
  Id: number;
  username: string;
  email: string;
  created_at: string; // or Date if you want to parse it
  updated_at: string; // or Date
  role: string;
  hotels: string[]; // Array of hotel names
}


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
    // ✅ Updated query to fetch multiple hotels per user
    const query = `
        SELECT 
            u.Id, 
            u.username, 
            u.email, 
            u.created_at, 
            u.updated_at, 
            r.role_name AS role,  
            STRING_AGG(h.name, ', ') AS hotels  -- Combine multiple hotel names into a string
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN user_hotels uh ON u.Id = uh.user_id  -- Join with user_hotels
        LEFT JOIN hotels h ON uh.hotel_id = h.Id       -- Fetch hotel names
        GROUP BY u.Id, u.username, u.email, u.created_at, u.updated_at, r.role_name;
    `;

    const result = await dbQuery(pool, query);

    // ✅ Convert hotels from comma-separated string to an array
    const users = result.recordset.map(
      (user: User & { hotels: string | null }) => ({
        ...user,
        hotels: user.hotels ? user.hotels.split(", ") : [], // Fix applied
      })
    );


    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch users", error },
      { status: 500 }
    );
  }
}


// export async function POST(req:NextRequest):Promise<NextResponse>{
//     const { isAuthorized, user, message } = await verifyAuth(req, [
//       "Admin",
//       "System-Admin",
//     ]);
//     if (!isAuthorized) {
//         return NextResponse.json(
//             { message },
//             {status:403}
//         );
//     }
//     const action = "Create User"
//     const {username, password, email, role_id, hotel_id}:CreateUserRequest = await req.json();
//     if(!username || !password || !email || isNaN(role_id) || isNaN(hotel_id)){
//         return NextResponse.json(
//             {message: "Invalid request"},
//             {status:400}
//             )
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const pool = await connectDb();
//     try {
//         const query = `INSERT INTO users (username, password, email, role_id, hotel_id, created_at, updated_at)
//          VALUES (@username, @password, @email, @role_id, @hotel_id, GETDATE(), GETDATE())`;
//         const result = await dbQuery(pool, query, { username, password: hashedPassword, email, role_id, hotel_id });

//         if(!result){
//             return NextResponse.json(
//                 {message: "Failed to create user"},
//                 {status:500}
//                 )
//         }

//         await logAction(
//             pool,
//             user?.id || null,
//             user?.role || null,
//             "users",
//             action,
//             `Created User with username: ${username}`
//         )
//         return NextResponse.json(
//             {message:"User Created Successfully!"},
//             {status:201}
//         )
//     } catch (error) {
//         return NextResponse.json(
//             {message: "Failed to create user", error},
//             {status:500}
//             )
//     }
// }

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { isAuthorized, user, message } = await verifyAuth(req, [
    "Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const action = "Create User";
  const { username, password, email, role_id, hotels }: CreateUserRequest =
    await req.json();

  // ✅ Validate input
  if (
    !username ||
    !password ||
    !email ||
    isNaN(role_id) ||
    !Array.isArray(hotels) ||
    hotels.length === 0
  ) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const pool = await connectDb();

  try {
    // ✅ Step 1: Insert into `users` table
    const userQuery = `INSERT INTO users (username, password, email, role_id, created_at, updated_at) 
                      OUTPUT INSERTED.Id 
                      VALUES (@username, @password, @email, @role_id, GETDATE(), GETDATE())`;

    const userResult = await dbQuery(pool, userQuery, {
      username,
      password: hashedPassword,
      email,
      role_id,
    });

    if (!userResult || userResult.recordset.length === 0) {
      return NextResponse.json(
        { message: "Failed to create user" },
        { status: 500 }
      );
    }

    const userId = userResult.recordset[0].Id; // ✅ Get the newly created user ID

    // ✅ Step 2: Insert multiple rows into `user_hotels`

    const hotelParams: Record<string, any> = { user_id: userId };
    hotels.forEach((hotelId, index) => {
      hotelParams[`hotel_id${index}`] = hotelId;
    });

    const hotelInsertQuery = `INSERT INTO user_hotels (user_id, hotel_id) VALUES ${hotels
      .map((_, i) => `(@user_id, @hotel_id${i})`)
      .join(", ")}`;

    const hotelResult = await dbQuery(pool, hotelInsertQuery, hotelParams);

    if (!hotelResult) {
      return NextResponse.json(
        { message: "Failed to assign hotels to user" },
        { status: 500 }
      );
    }

    // ✅ Step 3: Log action
    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "users",
      action,
      `Created User with username: ${username}`
    );

    return NextResponse.json(
      { message: "User Created Successfully!" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create user", error },
      { status: 500 }
    );
  }
}