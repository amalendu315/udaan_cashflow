import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";


import { UserPayload } from "@/types";



export async function verifyAuth(
  req: NextRequest,
  allowedRoles: string[] = []
) {
  const token = req.headers.get("authorization")?.split("Bearer ")[1];

  if (!token) {
    return {
      isAuthorized: false,
      message: "Unauthorized: No token provided",
    };
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;

    // Check if the user's role is allowed
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return {
        isAuthorized: false,
        message: "Forbidden: You do not have access to this resource",
      };
    }

    return { isAuthorized: true, user };
  } catch (error) {
    console.error("Invalid token:", error);
    return {
      isAuthorized: false,
      message: "Unauthorized: Invalid token",
    };
  }
}
