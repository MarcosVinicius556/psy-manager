import { runPaymentRemindersCron } from "@/lib/server/payment-reminders-cron";
import type { DailyCronJob } from "../runner";

const BATCH_LIMIT = 120;

export const paymentRemindersJob: DailyCronJob = {
  id: "payment_reminders",
  batchLimit: BATCH_LIMIT,
  async run(db, { cursor, now }) {
    const result = await runPaymentRemindersCron(db, now, cursor);
    return {
      processed: result.processed,
      cursor: result.cursor,
      details: {
        emailsSent: result.emailsSent,
        day: result.day,
      },
    };
  },
};
