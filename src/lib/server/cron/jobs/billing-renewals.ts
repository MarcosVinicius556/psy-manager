import { runBillingRenewalsCron } from "@/lib/server/billing-renewals-cron";
import type { DailyCronJob } from "../runner";

const BATCH_LIMIT = 200;

export const billingRenewalsJob: DailyCronJob = {
  id: "billing_renewals",
  batchLimit: BATCH_LIMIT,
  async run(db, { cursor, now }) {
    const result = await runBillingRenewalsCron(db, now, cursor);
    return {
      processed: result.processed,
      cursor: result.cursor,
      details: {
        noticesCreated: result.noticesCreated,
        statusUpdates: result.statusUpdates,
        emailsDelivered: result.emailsDelivered,
      },
    };
  },
};
