import { NextResponse } from "next/server";
import { connectDb } from "@/db/config";

interface CashflowEntry {
  date: string;
  projected_inflow: number;
  actual_inflow: number;
  total_payments: number;
  closing: number;
  projected_breakdown: { ledger_name: string; amount: number }[];

  // ✅ Temporarily Add Internal Fields for Query Processing
  view_closing?: number | null; // Closing from the view
  table_closing?: number | null; // Closing from the cashflow table
}


// export async function GET() {
//   const pool = await connectDb();

//   try {
//     // ✅ Step 1: Fetch All Ledger Names
//     const ledgerNamesResult = await pool.query(`SELECT id, name FROM ledgers`);
//     const ledgerNames = ledgerNamesResult.recordset;

//     // ✅ Step 2: Fetch All Cashflow Data from **v_cashflow_with_payments**
//     const cashflowQuery = `
//   SELECT 
//     CAST(c.date AS DATE) AS date,
//     c.projected_inflow,
//     c.actual_inflow,
//     c.total_payments,  -- ✅ Ensure this is correctly fetched
//     c.closing
//   FROM v_cashflow_with_payments c  
//   LEFT JOIN actual_inflow ai ON CAST(c.date AS DATE) = CAST(ai.date AS DATE)
//   ORDER BY c.date;
// `;



// const cashflowResult = await pool.request().query(cashflowQuery);
// console.log('cashflowResult', cashflowResult)
//     const cashflowData: CashflowEntry[] = cashflowResult.recordset;

//     // ✅ Step 3: Fetch Payments Data (Ensuring All Dates Exist)
//   //  const paymentsQuery = `
//   //     SELECT 
//   //       FORMAT(cf.date, 'yyyy-MM-dd') AS date,
//   //       COALESCE(SUM(CASE WHEN pr.status = 'Transfer Completed' THEN pr.amount ELSE 0 END), 0) AS payment_requests,
//   //       COALESCE(SUM(sp.EMI), 0) AS scheduled_payments,
//   //       COALESCE(SUM(mp.amount), 0) AS monthly_payments
//   //     FROM v_cashflow_with_payments cf  -- Ensure all dates exist
//   //     LEFT JOIN payment_requests pr 
//   //       ON FORMAT(pr.due_date, 'yyyy-MM-dd') = FORMAT(cf.date, 'yyyy-MM-dd')
//   //     LEFT JOIN scheduled_payments sp 
//   //       ON FORMAT(sp.date, 'yyyy-MM-dd') = FORMAT(cf.date, 'yyyy-MM-dd')
//   //     LEFT JOIN monthly_payments mp 
//   //       ON DATEFROMPARTS(YEAR(cf.date), MONTH(cf.date), mp.day_of_month) = cf.date  -- ✅ FIXED JOIN CONDITION
//   //     GROUP BY cf.date
//   //     ORDER BY cf.date;
//   //   `;

//     // const paymentsResult = await pool.request().query(paymentsQuery);
//     // const paymentsData = paymentsResult.recordset;

//     // ✅ Step 4: Fetch Projected Inflow Breakdown
//     const breakdownQuery = `
//       SELECT 
//         pi.id AS inflow_id, 
//         FORMAT(pi.date, 'yyyy-MM-dd') AS date, 
//         l.name AS ledger_name, 
//         ISNULL(pil.amount, 0) AS amount
//       FROM projected_inflow pi
//       CROSS JOIN (SELECT id, name FROM ledgers) l
//       LEFT JOIN projected_inflow_ledgers pil 
//       ON pil.projected_inflow_id = pi.id AND pil.ledger_id = l.id
//       ORDER BY pi.date, l.id;
//     `;

//     const breakdownResult = await pool.request().query(breakdownQuery);
//     const breakdownData = breakdownResult.recordset;

//     // ✅ Step 5: Merge Data
//     const cashflowWithBreakdown = cashflowData.map((entry) => {
//       // const payments = paymentsData.find((p) => p.date === entry.date) || {
//       //   payment_requests: 0,
//       //   scheduled_payments: 0,
//       //   monthly_payments: 0,
//       // };

//       return {
//         ...entry,
//         total_payments: entry.total_payments,
//         projected_breakdown: ledgerNames.map(({ name }) => ({
//           ledger_name: name,
//           amount:
//             breakdownData.find(
//               (b) => b.date === entry.date && b.ledger_name === name
//             )?.amount || 0,
//         })),
//       };
//     });

//     return NextResponse.json(cashflowWithBreakdown, { status: 200 });
//   } catch (error) {
//     console.error("Error fetching cashflow data:", error);
//     return NextResponse.json(
//       { message: "Error fetching cashflow data", error },
//       { status: 500 }
//     );
//   }
// }

export async function GET() {
  const pool = await connectDb();

  try {
    // ✅ Step 1: Fetch All Ledger Names
    const ledgerNamesResult = await pool.query(`SELECT id, name FROM ledgers`);
    const ledgerNames = ledgerNamesResult.recordset;

    // ✅ Step 2: Fetch All Cashflow Data from **v_cashflow_with_payments**
    const cashflowQuery = `
      SELECT 
        CAST(c.date AS DATE) AS date,
        c.projected_inflow,
        c.actual_inflow,
        c.total_payments,  -- ✅ Ensure this is correctly fetched
        c.closing AS view_closing, -- ✅ Keep the closing from the view
        cf.closing AS table_closing -- ✅ Fetch closing from cashflow table
      FROM v_cashflow_with_payments c  
      LEFT JOIN cashflow cf ON CAST(c.date AS DATE) = CAST(cf.date AS DATE) -- ✅ Ensure the real closing is fetched
      ORDER BY c.date;
    `;

    const cashflowResult = await pool.request().query(cashflowQuery);
    const cashflowData: CashflowEntry[] = cashflowResult.recordset;

    // ✅ Step 3: Fetch Projected Inflow Breakdown
    const breakdownQuery = `
      SELECT 
        pi.id AS inflow_id, 
        FORMAT(pi.date, 'yyyy-MM-dd') AS date, 
        l.name AS ledger_name, 
        ISNULL(pil.amount, 0) AS amount
      FROM projected_inflow pi
      CROSS JOIN (SELECT id, name FROM ledgers) l
      LEFT JOIN projected_inflow_ledgers pil 
      ON pil.projected_inflow_id = pi.id AND pil.ledger_id = l.id
      ORDER BY pi.date, l.id;
    `;

    const breakdownResult = await pool.request().query(breakdownQuery);
    const breakdownData = breakdownResult.recordset;

    // ✅ Step 4: Merge Data and Override Closing
    const cashflowWithBreakdown = cashflowData.map((entry) => ({
      ...entry,
      closing: entry.view_closing ?? entry.table_closing, // ✅ Use closing from cashflow table if view_closing is NULL
      projected_breakdown: ledgerNames.map(({ name }) => ({
        ledger_name: name,
        amount:
          breakdownData.find(
            (b) => b.date === entry.date && b.ledger_name === name
          )?.amount || 0,
      })),
    }));

    return NextResponse.json(cashflowWithBreakdown, { status: 200 });
  } catch (error) {
    console.error("Error fetching cashflow data:", error);
    return NextResponse.json(
      { message: "Error fetching cashflow data", error },
      { status: 500 }
    );
  }
}



