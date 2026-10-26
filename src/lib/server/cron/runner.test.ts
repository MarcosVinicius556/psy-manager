import { describe, expect, it, vi } from "vitest";
import { runDailyJob, type DailyCronJob } from "./runner";

describe("runDailyJob", () => {
  it("não executa de novo quando o dia já está completed", async () => {
    const run = vi.fn(async () => ({ processed: 1, cursor: null }));
    const job: DailyCronJob = {
      id: "test_job",
      batchLimit: 10,
      run,
    };
    const store = new Map<string, Record<string, unknown>>();
    const db = {
      collection: (name: string) => ({
        doc: (id: string) => ({
          get: async () => ({
            exists: store.has(`${name}/${id}`),
            data: () => store.get(`${name}/${id}`),
          }),
          set: async (data: Record<string, unknown>, opts?: { merge?: boolean }) => {
            const key = `${name}/${id}`;
            store.set(key, opts?.merge ? { ...store.get(key), ...data } : data);
          },
        }),
      }),
    };

    await runDailyJob(db as never, job, Date.parse("2026-06-01T12:00:00Z"));
    expect(run).toHaveBeenCalledTimes(1);
    await runDailyJob(db as never, job, Date.parse("2026-06-01T15:00:00Z"));
    expect(run).toHaveBeenCalledTimes(1);
  });
});
