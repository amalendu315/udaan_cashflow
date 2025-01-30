import { connectDb } from "@/db/config";
import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // Expected format: YYYY-MM
  const pool = await connectDb();

  try {
    // Fetch Opening Balance
    const openingBalanceQuery = `
      SELECT closing AS opening_balance
      FROM cashflow
      WHERE FORMAT(date, 'yyyy-MM') = FORMAT(DATEADD(MONTH, -1, '${month}-01'), 'yyyy-MM')
    `;
    const openingBalanceData = await pool.request().query(openingBalanceQuery);
    const openingBalance =
      openingBalanceData.recordset[0]?.opening_balance || 0;

    // Fetch Projected Inflow
    const projectedInflowQuery = `
      SELECT 
        ledger_name, 
        SUM(total_amount) AS total 
      FROM projected_inflow
      WHERE FORMAT(date, 'yyyy-MM') = '${month}'
      GROUP BY ledger_name
    `;
    const projectedInflow = await pool.request().query(projectedInflowQuery);

    // Fetch Outflow (Monthly Payments + Scheduled Payments + Payment Requests)
    const outflowQuery = `
      SELECT 
        ledger_name,
        SUM(amount) AS total
      FROM (
        SELECT ledger_name, amount FROM monthly_payments WHERE FORMAT(payment_date, 'yyyy-MM') = '${month}'
        UNION ALL
        SELECT ledger_name, total_amount AS amount FROM scheduled_payments WHERE FORMAT(date, 'yyyy-MM') = '${month}'
        UNION ALL
        SELECT ledger_name, amount FROM payment_requests WHERE FORMAT(due_date, 'yyyy-MM') = '${month}'
      ) AS outflows
      GROUP BY ledger_name
    `;
    const outflow = await pool.request().query(outflowQuery);

    // Calculate totals
    const totalInflow = projectedInflow.recordset.reduce(
      (sum, item) => sum + item.total,
      0
    );
    const totalOutflow = outflow.recordset.reduce(
      (sum, item) => sum + item.total,
      0
    );
    const netCashInHand = openingBalance + totalInflow - totalOutflow;

    // Generate PDF in memory
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {});

    // Report Title
    doc
      .fontSize(18)
      .text("Udaan Hotels and Resorts Pvt Ltd", { align: "center" });
    doc.fontSize(14).text(`Cash Flow Statement for the Month of ${month}`, {
      align: "center",
    });
    doc.moveDown();

    // Opening Balance
    doc.fontSize(12).text("Opening Balance");
    doc.text(`Cash Balance: ₹${openingBalance.toFixed(2)}`);
    doc.text("Bank Balance: ₹0.00");
    doc.text(`Total Opening Balance: ₹${openingBalance.toFixed(2)}`);
    doc.moveDown();

    // Cash Inflow
    doc.fontSize(12).text("Cash In-Flow");
    projectedInflow.recordset.forEach((item) => {
      doc.text(`${item.ledger_name}: ₹${item.total.toFixed(2)}`);
    });
    doc.text(`Total Cash In-Flow: ₹${totalInflow.toFixed(2)}`);
    doc.moveDown();

    // Cash Outflow
    doc.fontSize(12).text("Cash Out-Flow");
    outflow.recordset.forEach((item) => {
      doc.text(`${item.ledger_name}: ₹${item.total.toFixed(2)}`);
    });
    doc.text(`Total Cash Out-Flow: ₹${totalOutflow.toFixed(2)}`);
    doc.moveDown();

    // Net Cash In Hand
    doc.text(`Net Cash in Hand: ₹${netCashInHand.toFixed(2)}`);
    doc.text(`Cash Balance: ₹${netCashInHand.toFixed(2)}`);
    doc.text("Bank Balance: ₹0.00");
    doc.end();

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=cashflow-report-${month}.pdf`,
      },
    });
  } catch (error: unknown) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { message: "Error generating report", error: String(error) },
      { status: 500 }
    );
  }
}
