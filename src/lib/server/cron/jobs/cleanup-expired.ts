import type { DailyCronJob } from "../runner";

const BATCH_LIMIT = 200;

const EXPIRED_COLLECTIONS = ["sessionFeedbacks", "signatureRequests", "formRequests", "portalInvites"] as const;

export const cleanupExpiredJob: DailyCronJob = {
  id: "cleanup_expired",
  batchLimit: BATCH_LIMIT,
  async run(db, { now }) {
    let processed = 0;
    const details: string[] = [];

    for (const collection of EXPIRED_COLLECTIONS) {
      if (processed >= BATCH_LIMIT) break;
      const remaining = BATCH_LIMIT - processed;
      try {
        const snapshot = await db
          .collection(collection)
          .where("expiresAtMillis", "<", now)
          .orderBy("expiresAtMillis")
          .limit(remaining)
          .get();
        for (const docSnap of snapshot.docs) {
          await docSnap.ref.delete();
          processed += 1;
        }
        details.push(`${collection}:${snapshot.size}`);
      } catch (error) {
        console.warn(`cleanup_expired: ${collection} falhou.`, error);
        details.push(`${collection}:skipped`);
      }
    }

    let confirmationsDeleted = 0;
    if (processed < BATCH_LIMIT) {
      try {
        const confirmations = await db
          .collection("sessionConfirmations")
          .where("expiresAtMillis", "<", now)
          .orderBy("expiresAtMillis")
          .limit(BATCH_LIMIT - processed)
          .get();
        for (const docSnap of confirmations.docs) {
          await docSnap.ref.delete();
          confirmationsDeleted += 1;
          processed += 1;
        }
      } catch (error) {
        console.warn("cleanup_expired: sessionConfirmations ignorado.", error);
      }
    }

    return {
      processed,
      cursor: null,
      details: { collections: details.join(","), sessionConfirmationsDeleted: confirmationsDeleted },
    };
  },
};
