import { NextRequest, NextResponse } from "next/server";

import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";
import { CreateLedgerRequest } from "@/types";
import { dbQuery, logAction } from "@/utils";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { isAuthorized, message } = await verifyAuth(req, [
    "Admin",
    "Sub-Admin",
    "System-Admin",
    "User"
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const pool = await connectDb();

  try {
    const query = "SELECT id, name FROM ledgers";
    const result = await dbQuery(pool, query);
    return NextResponse.json(result.recordset);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch ledgers", error },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { isAuthorized, message, user } = await verifyAuth(req, [
    "Admin",
    "System-Admin",
  ]);
  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const action = "Create Ledger";
  const { name }: CreateLedgerRequest = await req.json();
  const pool = await connectDb();

  try {
    const query = `
      INSERT INTO ledgers (name)
      OUTPUT INSERTED.id, INSERTED.name
      VALUES (@name)
    `;

    const result = await dbQuery(pool, query, { name });
    const newLedger = result.recordset[0];

    await logAction(
      pool,
      user?.id || null,
      user?.role || null,
      "ledgers",
      action,
      `Created ledger with name: ${name}`
    );


    return NextResponse.json(
      { message: "Ledger created successfully", ledger: newLedger },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error creating ledger", error },
      { status: 500 }
    );
  }
}
