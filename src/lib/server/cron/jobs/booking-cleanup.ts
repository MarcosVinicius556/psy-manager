import type { DailyCronJob } from "../runner";
import { BOOKING_REJECT_RETENTION_DAYS } from "@/lib/booking/config";

const BATCH_LIMIT = 200;
const MS_DAY = 24 * 60 * 60 * 1000;

export const bookingCleanupJob: DailyCronJob = {
  id: "booking_cleanup",
  batchLimit: BATCH_LIMIT,
  async run(db, { cursor, now }) {
    const cutoff = now - BOOKING_REJECT_RETENTION_DAYS * MS_DAY;
    let processed = 0;
    let lastId = cursor;

    const snap = await db.collection("bookingRequests").where("status", "==", "recusado").limit(BATCH_LIMIT).get();

    for (const docSnap of snap.docs) {
      if (lastId && docSnap.id <= lastId) continue;
      const resolved = docSnap.data().resolvedAtMillis;
      if (typeof resolved === "number" && resolved < cutoff) {
        await docSnap.ref.delete();
        processed += 1;
        lastId = docSnap.id;
      }
      if (processed >= BATCH_LIMIT) break;
    }

    const partial = snap.size >= BATCH_LIMIT;
    return {
      processed,
      cursor: partial ? lastId : null,
      details: { cutoffMillis: cutoff },
    };
  },
};
