import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/db/config";
import { verifyAuth } from "@/middlewares";

// Type for InflowRow
interface InflowRow extends Record<string, unknown> {
  id: number;
  date: string;
}

// Type for LedgerRow
interface LedgerRow {
  id: number;
  name: string;
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
    // Fetch all ledger names
    const ledgerNamesResult = await pool.query(`SELECT id, name FROM ledgers`);
    const ledgerNames: LedgerRow[] = ledgerNamesResult.recordset;

    // Fetch ALL inflows (no month filtering)
    const query = `
      SELECT 
        pi.id AS inflow_id, 
        FORMAT(pi.date, 'yyyy-MM-dd') AS date, 
        l.name AS ledger_name, 
        ISNULL(pil.amount, 0) AS amount
      FROM 
        projected_inflow pi
      CROSS JOIN 
        (SELECT id, name FROM ledgers) l
      LEFT JOIN 
        projected_inflow_ledgers pil 
      ON 
        pil.projected_inflow_id = pi.id
        AND pil.ledger_id = l.id
      ORDER BY 
        pi.date, l.id;
    `;

    const result = await pool.request().query(query);

    const inflowData: InflowRow[] = [];
    result.recordset.forEach((row) => {
      let existingRow: InflowRow | undefined = inflowData.find(
        (r) => r.date === row.date
      );

      if (!existingRow) {
        existingRow = {
          id: row.inflow_id,
          date: row.date,
          ...Object.fromEntries(ledgerNames.map((ledger) => [ledger.name, 0])),
        } as InflowRow;

        inflowData.push(existingRow);
      }

      if (typeof row.ledger_name === "string") {
        existingRow[row.ledger_name] = row.amount;
      }
    });

    return NextResponse.json(inflowData, { status: 200 });
  } catch (error) {
    console.error("Error fetching projected inflow:", error);
    return NextResponse.json(
      { message: "Failed to fetch projected inflow", error: error },
      { status: 500 }
    );
  }
}


export async function POST(req: NextRequest): Promise<NextResponse> {
  const { isAuthorized, message } = await verifyAuth(req, [
    "Admin",
    "Sub-Admin",
    "System-Admin",
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ message }, { status: 403 });
  }

  const { month }: { month: string } = await req.json(); // Expected format: "YYYY-MM"
  if (!month) {
    return NextResponse.json(
      { message: "Month is required." },
      { status: 400 }
    );
  }

  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();

  const pool = await connectDb();

  try {
    const transaction = pool.transaction();
    await transaction.begin();

    const ledgerNamesResult = await transaction.request().query(`
      SELECT id FROM ledgers
    `);
    const ledgerIds: number[] = ledgerNamesResult.recordset.map(
      (ledger: LedgerRow) => ledger.id
    );

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNumber - 1, day)
        .toISOString()
        .split("T")[0];

      // Insert into projected_inflow table
      const result = await transaction
        .request()
        .input("date", date)
        .input("total_amount", 0)
        .query(
          `INSERT INTO projected_inflow (date, total_amount) OUTPUT INSERTED.id VALUES (@date, @total_amount)`
        );

      const inflowId = result.recordset[0].id;

      // Insert into projected_inflow_ledgers for each ledger with amount 0
      for (const ledgerId of ledgerIds) {
        await transaction
          .request()
          .input("projected_inflow_id", inflowId)
          .input("ledger_id", ledgerId)
          .input("amount", 0).query(`
            INSERT INTO projected_inflow_ledgers (projected_inflow_id, ledger_id, amount)
            VALUES (@projected_inflow_id, @ledger_id, @amount)
          `);
      }

      // Insert into cashflow table
      await transaction
        .request()
        .input("date", date)
        .input("projected_inflow", 0)
        .input("actual_inflow", 0)
        .input("payment", 0)
        .input("closing", 0).query(`
          INSERT INTO cashflow (date, projected_inflow, actual_inflow, payment, closing)
          VALUES (@date, @projected_inflow, @actual_inflow, @payment, @closing)
        `);
    }

    await transaction.commit();

    return NextResponse.json(
      {
        message:
          "Projected inflow and cashflow created successfully for the month.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating bulk projected inflows:", error);
    return NextResponse.json(
      { message: "Error creating projected inflows", error: error },
      { status: 500 }
    );
  }
}
