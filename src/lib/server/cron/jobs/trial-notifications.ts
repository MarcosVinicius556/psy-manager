import { runTrialNotificationsCron } from "@/lib/server/trial-notifications-cron";
import type { DailyCronJob } from "../runner";

const BATCH_LIMIT = 500;

export const trialNotificationsJob: DailyCronJob = {
  id: "trial_notifications",
  batchLimit: BATCH_LIMIT,
  async run(db, { now }) {
    const result = await runTrialNotificationsCron(db, now);
    return {
      processed: result.scanned,
      skipped: result.skipped,
      details: {
        noticesCreated: result.noticesCreated,
        emailsAttempted: result.emailsAttempted,
        emailsDelivered: result.emailsDelivered,
      },
    };
  },
};
