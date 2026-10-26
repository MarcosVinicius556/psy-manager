import type { DailyCronJob } from "../runner";

const BATCH_LIMIT = 200;

export const cleanupExpiredJob: DailyCronJob = {
  id: "cleanup_expired",
  batchLimit: BATCH_LIMIT,
  async run(db, { cursor, now }) {
    let processed = 0;
    let lastId = cursor;

    let snapshot;
    try {
      snapshot = await db
        .collection("sessionFeedbacks")
        .where("expiresAtMillis", "<", now)
        .orderBy("expiresAtMillis")
        .limit(BATCH_LIMIT)
        .get();
    } catch (error) {
      console.warn("cleanup_expired: consulta com índice falhou, ignorando lote.", error);
      return { processed: 0, cursor: null, details: { skipped: true } };
    }
    for (const docSnap of snapshot.docs) {
      if (lastId && docSnap.id <= lastId) continue;
      await docSnap.ref.delete();
      processed += 1;
      lastId = docSnap.id;
      if (processed >= BATCH_LIMIT) break;
    }

    const partial = snapshot.size >= BATCH_LIMIT;
    return {
      processed,
      cursor: partial ? lastId : null,
      details: { collection: "sessionFeedbacks" },
    };
  },
};
