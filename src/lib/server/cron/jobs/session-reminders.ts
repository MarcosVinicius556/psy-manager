import { runSessionRemindersCron } from "@/lib/server/session-reminders-cron";
import type { DailyCronJob } from "../runner";

const BATCH_LIMIT = 120;

export const sessionRemindersJob: DailyCronJob = {
  id: "session_reminders",
  batchLimit: BATCH_LIMIT,
  async run(db, { cursor, now }) {
    const result = await runSessionRemindersCron(db, now, cursor);
    return {
      processed: result.processed,
      cursor: result.cursor,
      details: {
        emailsSent: result.emailsSent,
        day: result.day,
        skipped: result.skipped,
      },
    };
  },
};
