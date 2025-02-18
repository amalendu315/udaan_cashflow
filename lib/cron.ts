import cron from "node-cron";
import fetch from "node-fetch";

const startCronJobs = () => {
  console.log("🔄 Payment Reminder Cron Job Initialized...");

  // Run daily at 00:00 (midnight)
  cron.schedule("0 0 * * *", async () => {
    console.log("⏳ Running Payment Reminder Job...");
    try {
      const response = await fetch(
        `${process.env.BASE_URL}/api/send-reminders`
      );
      console.log('response', response)
      const data:any = await response.json();
      console.log("✅ Reminder Job Status:", data.message);
    } catch (error) {
      console.error("❌ Reminder job failed:", error);
    }
  });
};

export { startCronJobs };
