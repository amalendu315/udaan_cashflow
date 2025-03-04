import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
import { CreateUserRequest } from "@/types";
import { dbQuery, logAction } from "@/utils";


interface UserRecord {
  Id: number;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
  role: string;
  hotel_data: string | null; // Can be NULL from SQL
  approver_data: string | null; // Can be NULL from SQL
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
    // ✅ Updated query to fetch assigned approvers and hotels per user
    const query = `
       WITH HotelData AS (
    SELECT uh.user_id, STRING_AGG(CONCAT(h.Id, ':', h.name), ',') AS hotel_data
    FROM user_hotels uh
    INNER JOIN hotels h ON uh.hotel_id = h.Id
    GROUP BY uh.user_id
),
ApproverData AS (
    SELECT ua.user_id, STRING_AGG(CONCAT(a.Id, ':', a.username), ',') AS approver_data
    FROM user_approvers ua
    INNER JOIN users a ON ua.approver_id = a.Id
    GROUP BY ua.user_id
)
SELECT 
    u.Id, 
    u.username, 
    u.email, 
    u.created_at, 
    u.updated_at, 
    r.role_name AS role,  
    COALESCE(hd.hotel_data, '') AS hotel_data,  -- ✅ Avoid NULL values
    COALESCE(ad.approver_data, '') AS approver_data
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN HotelData hd ON u.Id = hd.user_id  
LEFT JOIN ApproverData ad ON u.Id = ad.user_id  
    `;

    const result = await dbQuery(pool, query);

    // ✅ Use the defined `UserRecord` type instead of `any`
    const users = result.recordset.map((user: UserRecord) => ({
      id: user.Id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
      role: user.role,
      hotels: user.hotel_data
        ? user.hotel_data.split(",").map((h) => {
            const [hotelId, hotelName] = h.split(":");
            return { id: Number(hotelId), name: hotelName };
          })
        : [],
      approvers: user.approver_data
        ? user.approver_data.split(",").map((a) => {
            const [approverId, approverName] = a.split(":");
            return { id: Number(approverId), name: approverName };
          })
        : [],
    }));

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
  const {
    username,
    password,
    email,
    role_id,
    hotels,
    approvers,
  }: CreateUserRequest = await req.json();

  // ✅ Validate input
  if (
    !username ||
    !password ||
    !email ||
    isNaN(role_id) ||
    !Array.isArray(hotels) ||
    hotels.length === 0 ||
    !Array.isArray(approvers) // ✅ Validate that approvers are provided
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
    const hotelParams: Record<string, unknown> = { user_id: userId };
    hotels.forEach((hotelId, index) => {
      hotelParams[`hotel_id${index}`] = hotelId;
    });

    const hotelInsertQuery = `INSERT INTO user_hotels (user_id, hotel_id) VALUES ${hotels
      .map((_, i) => `(@user_id, @hotel_id${i})`)
      .join(", ")}`;

    await dbQuery(pool, hotelInsertQuery, hotelParams);

    // ✅ Step 3: Insert assigned approvers into `user_approvers`
    if (approvers.length > 0) {
      const approverParams: Record<string, unknown> = { user_id: userId };
      approvers.forEach((approverId, index) => {
        approverParams[`approver_id${index}`] = approverId;
      });

      const approverInsertQuery = `INSERT INTO user_approvers (user_id, approver_id) VALUES ${approvers
        .map((_, i) => `(@user_id, @approver_id${i})`)
        .join(", ")}`;

      await dbQuery(pool, approverInsertQuery, approverParams);
    }

    // ✅ Step 4: Log action
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
