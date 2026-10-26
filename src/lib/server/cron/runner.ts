import type { Firestore } from "firebase-admin/firestore";

export type DailyCronJobResult = {
  processed: number;
  skipped?: number;
  details?: Record<string, unknown>;
};

export type DailyCronJob = {
  id: string;
  /** Máximo de documentos por execução (lote). */
  batchLimit: number;
  run: (db: Firestore, ctx: { cursor: string | null; now: number }) => Promise<DailyCronJobResult & { cursor?: string | null }>;
};

export type DailyCronRunSummary = {
  jobId: string;
  dayKey: string;
  status: "completed" | "partial";
  processed: number;
  cursor: string | null;
  details?: Record<string, unknown>;
};

function dayKey(now = Date.now()) {
  const d = new Date(now);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function authorizeCron(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.warn("cron: CRON_SECRET ausente");
    return false;
  }
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

export async function runDailyJob(db: Firestore, job: DailyCronJob, now = Date.now()): Promise<DailyCronRunSummary> {
  const day = dayKey(now);
  const runRef = db.collection("cronRuns").doc(`${job.id}_${day}`);
  const existing = await runRef.get();
  if (existing.exists && existing.data()?.status === "completed") {
    return {
      jobId: job.id,
      dayKey: day,
      status: "completed",
      processed: Number(existing.data()?.processed) || 0,
      cursor: null,
      details: { idempotent: true },
    };
  }

  const cursor = existing.exists ? (existing.data()?.cursor as string | null) : null;
  const result = (await job.run(db, { cursor, now })) ?? { processed: 0 };
  const processed = (Number(existing.data()?.processed) || 0) + (result.processed || 0);
  const nextCursor = result.cursor ?? null;
  const completed = !nextCursor || (result.processed || 0) < job.batchLimit;
  const status = completed ? "completed" : "partial";

  await runRef.set(
    {
      jobId: job.id,
      dayKey: day,
      status,
      processed,
      cursor: completed ? null : nextCursor,
      updatedAt: new Date(now).toISOString(),
      ...(result.details ? { details: result.details } : {}),
    },
    { merge: true }
  );

  return {
    jobId: job.id,
    dayKey: day,
    status,
    processed,
    cursor: completed ? null : nextCursor,
    details: result.details,
  };
}

export async function runDailyDispatcher(db: Firestore, jobs: DailyCronJob[], now = Date.now()) {
  const results: DailyCronRunSummary[] = [];
  for (const job of jobs) {
    results.push(await runDailyJob(db, job, now));
  }
  return results;
}
