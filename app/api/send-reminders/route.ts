import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/db/config";
import nodemailer from "nodemailer";
import sql from "mssql";

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail", // Change based on your email provider
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // App password
  },
});

export async function GET() {
  const pool = await connectDb();

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextDay = tomorrow.toISOString().split("T")[0];

    // 🔹 Fetch all payments due tomorrow
    const query = `
      SELECT 'Payment Request' AS payment_type, pr.id, pr.amount, pr.due_date, u.email
      FROM payment_requests pr
      JOIN users u ON pr.user_id = u.id
      WHERE FORMAT(pr.due_date, 'yyyy-MM-dd') = @nextDay

      UNION ALL

      SELECT 'Monthly Payment' AS payment_type, mp.id, mp.amount, FORMAT(GETDATE(), 'yyyy-MM') + '-' + FORMAT(mp.day_of_month, '00') AS due_date, u.email
      FROM monthly_payments mp
      JOIN users u ON mp.user_id = u.id
      WHERE mp.day_of_month = DAY(@nextDay)

      UNION ALL

      SELECT 'Scheduled Payment' AS payment_type, sp.id, sp.EMI AS amount, sp.date AS due_date, u.email
      FROM scheduled_payments sp
      JOIN users u ON sp.user_id = u.id
      WHERE FORMAT(sp.date, 'yyyy-MM-dd') = @nextDay;
    `;

    const result = await pool
      .request()
      .input("nextDay", sql.Date, nextDay)
      .query(query);
    const payments = result.recordset;

    if (payments.length === 0) {
      return NextResponse.json(
        { message: "No payments due tomorrow." },
        { status: 200 }
      );
    }

    // 🔹 Send reminder emails
    for (const payment of payments) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'amalendu.pandey@airiq.in',
        subject: `Payment Reminder: ${payment.payment_type}`,
        html: `
          <p>Dear User,</p>
          <p>This is a reminder for your upcoming <strong>${payment.payment_type}</strong>.</p>
          <ul>
            <li><strong>Amount:</strong> ₹${payment.amount}</li>
            <li><strong>Due Date:</strong> ${payment.due_date}</li>
          </ul>
          <p>Please ensure timely payment to avoid any inconvenience.</p>
          <p>Best Regards,<br>Finance Team</p>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    return NextResponse.json(
      { message: "Reminders sent successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending reminders:", error);
    return NextResponse.json(
      { message: "Failed to send reminders.", error },
      { status: 500 }
    );
  }
}
