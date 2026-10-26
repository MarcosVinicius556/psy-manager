import type { DailyCronJob } from "./runner";
import { cleanupExpiredJob } from "./jobs/cleanup-expired";
import { sessionRemindersJob } from "./jobs/session-reminders";
import { trialNotificationsJob } from "./jobs/trial-notifications";

/** Jobs registrados no dispatcher diário (ordem de execução). */
export const dailyCronJobs: DailyCronJob[] = [trialNotificationsJob, sessionRemindersJob, cleanupExpiredJob];
