import { describe, expect, it } from "vitest";
import { summarizeActivationMetrics } from "./activation-metrics";
import { buildTrialAccount } from "./model";

describe("activation metrics", () => {
  it("calcula funil e mediana de tempo até a primeira sessão", () => {
    const now = Date.parse("2026-06-15T12:00:00.000Z");
    const account = buildTrialAccount({
      uid: "uid-1",
      email: "a@example.com",
      nome: "A",
      clinicName: "",
      now,
      termsAcceptedAt: new Date(now).toISOString(),
    });
    account.createdAt = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();
    account.lastSeenAt = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
    account.trialEndsAtMillis = now + 3 * 24 * 60 * 60 * 1000;

    const summary = summarizeActivationMetrics(
      [
        { id: "uid-1_signup", accountId: "uid-1", event: "signup", at: account.createdAt },
        {
          id: "uid-1_primeira_sessao_concluida",
          accountId: "uid-1",
          event: "primeira_sessao_concluida",
          at: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      [account],
      now
    );

    expect(summary.funnel[0]?.count).toBe(1);
    expect(summary.medianDaysToFirstSession).toBe(3);
    expect(summary.atRisk.length).toBe(1);
  });
});
