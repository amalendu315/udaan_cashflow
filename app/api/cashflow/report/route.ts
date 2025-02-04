import { NextRequest } from "next/server";
import { connectDb } from "@/db/config";
import sql from "mssql";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";
import { formatCurrency } from "@/utils";

export async function POST(req: NextRequest) {
  try {
    const { month } = await req.json();
    if (!month) {
      return new Response(JSON.stringify({ message: "Month required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [year, monthNumber] = month.split("-").map(Number);
    const startDate = `${year}-${monthNumber.toString().padStart(2, "0")}-01`;
    const endDate = new Date(year, monthNumber, 0).toISOString().split("T")[0];

    const pool = await connectDb();

    // 🟢 Get Opening Balance
    const openingBalanceQuery = `
      SELECT closing FROM cashflow 
      WHERE date = DATEADD(DAY, -1, @startDate)
    `;
    const openingResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .query(openingBalanceQuery);
    const openingBalance = openingResult.recordset[0]?.closing || 0;
    const bankBalance = 0.02; // Static value

    // 🟢 Get Cash In-Flow
    const inflowQuery = `
      SELECT l.name AS ledger_name, SUM(pil.amount) AS total_amount
      FROM projected_inflow pi
      JOIN projected_inflow_ledgers pil ON pi.id = pil.projected_inflow_id
      JOIN ledgers l ON pil.ledger_id = l.id
      WHERE pi.date BETWEEN @startDate AND @endDate
      GROUP BY l.name
    `;
    const inflowResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .query(inflowQuery);
    const inflows = inflowResult.recordset;

    // 🟢 Get Cash Out-Flow
    const expensesQuery = `
      SELECT pg.name AS payment_group, SUM(pr.amount) AS total_amount
      FROM payment_requests pr
      JOIN payment_groups pg ON pr.payment_group_id = pg.id
      WHERE pr.date BETWEEN @startDate AND @endDate
      GROUP BY pg.name
    `;
    const expensesResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .query(expensesQuery);
    const expenses = expensesResult.recordset;

    // 🟢 Get Scheduled & Monthly Payments
    const scheduledPaymentsQuery = `
      SELECT SUM(sp.EMI) AS total_amount
      FROM scheduled_payments sp
      WHERE sp.date BETWEEN @startDate AND @endDate
    `;
    const scheduledResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .query(scheduledPaymentsQuery);
    const scheduledPayments = scheduledResult.recordset[0]?.total_amount || 0;

    const monthlyPaymentsQuery = `
      SELECT SUM(mp.amount) AS total_amount
      FROM monthly_payments mp
      WHERE 
        DATEFROMPARTS(YEAR(@startDate), MONTH(@startDate), mp.day_of_month) >= @startDate
        AND DATEFROMPARTS(YEAR(@endDate), MONTH(@endDate), mp.day_of_month) <= @endDate
    `;
    const monthlyResult = await pool
      .request()
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .query(monthlyPaymentsQuery);
    const monthlyPayments = monthlyResult.recordset[0]?.total_amount || 0;

    const otherPayments = scheduledPayments + monthlyPayments;

    // 🟢 Calculate Net Cash in Hand
    const totalCashInflow = inflows.reduce(
      (sum, item) => sum + item.total_amount,
      0
    );
    const totalExpenses =
      expenses.reduce((sum, item) => sum + item.total_amount, 0) +
      otherPayments;
    const netCashInHand = openingBalance + totalCashInflow - totalExpenses;

    // 📝 Generate PDF Report
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();

    // ✅ Load Custom Font for ₹ Symbol
    const fontPath = path.join(
      process.cwd(),
      "public/fonts/Roboto-Regular.ttf"
    );
    const fontBytes = fs.readFileSync(fontPath);
    const customFont = await pdfDoc.embedFont(fontBytes);

    let y = height - 50;

    // Draw divider
    const drawDivider = () => {
      y -= 5;
      page.drawLine({
        start: { x: 50, y },
        end: { x: width - 50, y },
        thickness: 1,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 20;
    };

    const drawCenteredText = (text: string, fontSize: number) => {
      const textWidth = customFont.widthOfTextAtSize(text, fontSize);
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y,
        font: customFont,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      y -= 30;
    };

    // 🔹 **Title**
    drawCenteredText("Udaan Hotels and Resorts Pvt Ltd", 18);
    drawCenteredText(`Cash Flow Statement (${month})`, 14);
    drawDivider();

    // 🔹 **Opening Balance**
    drawCenteredText("Opening Balance", 14);
    y -= 10;
    page.drawText(`Cash Balance:`, {
      x: 70,
      y,
      font: customFont,
      size: 12,
    });
    page.drawText(`${formatCurrency(openingBalance)}`, {
      x: 400,
      y,
      font: customFont,
      size: 12,
    });
    // page.drawText(`Cash Balance: ${formatCurrency(openingBalance)}`, {
    //   x: 70,
    //   y,
    //   font: customFont,
    //   size: 12,
    // });
    y -= 20;
    page.drawText(`Bank Balance:`, {
      x: 70,
      y,
      font: customFont,
      size: 12,
    });
    page.drawText(`${formatCurrency(bankBalance)}`, {
      x: 400,
      y,
      font: customFont,
      size: 12,
    });
    // page.drawText(`Bank Balance: ${formatCurrency(bankBalance)}`, {
    //   x: 70,
    //   y,
    //   font: customFont,
    //   size: 12,
    // });
    // drawCenteredText(`Bank Balance: ${formatCurrency(bankBalance)}`, 12);
    drawDivider();

    // 🔹 **Cash In-Flow**
    drawCenteredText("Cash In-Flow", 14);
    y -= 10;
    inflows.forEach((inflow) => {
      page.drawText(`${inflow.ledger_name}:`, {
        x: 70,
        y,
        font: customFont,
        size: 12,
      });
      page.drawText(`${formatCurrency(inflow.total_amount)}`, {
        x: 400,
        y,
        font: customFont,
        size: 12,
      });
      y -= 20;
    });
    drawDivider();

    // 🔹 **Cash Out-Flow**
    drawCenteredText("Cash Out-Flow", 14);
    y -= 10;
    expenses.forEach((exp) => {
      page.drawText(`${exp.payment_group}:`, {
        x: 70,
        y,
        font: customFont,
        size: 12,
      });
      page.drawText(`${formatCurrency(exp.total_amount)}`, {
        x: 400,
        y,
        font: customFont,
        size: 12,
      });
      y -= 20;
    });

    // ✅ Explicitly adding "Other Payments"
    page.drawText(`Other Payments:`, {
      x: 70,
      y,
      font: customFont,
      size: 12,
    });
    page.drawText(`${formatCurrency(otherPayments)}`, {
      x: 400,
      y,
      font: customFont,
      size: 12,
    });
    // page.drawText(`Other Payments: ${formatCurrency(otherPayments)}`, {
    //   x: 70,
    //   y,
    //   font: customFont,
    //   size: 12,
    // });
    drawDivider();

    // 🔹 **Net Cash in Hand & Bank Balance**
    // drawCenteredText("Net Cash in Hand", 14);
    page.drawText(`Net Cash in Hand:`, {
      x: 70,
      y,
      font: customFont,
      size: 14,
    });
    const netColor = netCashInHand < 0 ? rgb(1, 0, 0) : rgb(0, 0.5, 0);
    page.drawText(`${formatCurrency(netCashInHand)}`, {
      x:400,
      y,
      font: customFont,
      size: 14,
      color: netColor,
    });
    

    const pdfBytes = await pdfDoc.save();
    return new Response(pdfBytes, {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Error generating report", error }),
      { status: 500 }
    );
  }
}
