import cron from "node-cron";
import fetch from "node-fetch";

interface CronResponse {
  message:string;
  status:number;
}

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
      const data = await response.json();
      console.log("✅ Reminder Job Status:", (data as CronResponse)?.message);
    } catch (error) {
      console.error("❌ Reminder job failed:", (error as Error)?.message);
    }
  });
};

export { startCronJobs };
