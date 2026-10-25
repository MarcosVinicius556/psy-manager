import { describe, expect, it } from "vitest";
import { isBotQueueEligible, isBotLocked } from "./queue";
import type { SupportTicketRecord } from "./types";

function baseTicket(overrides: Partial<SupportTicketRecord> = {}): SupportTicketRecord {
  return {
    id: "t1",
    humanId: "CH-000001",
    title: "x",
    description: "d",
    extraInfo: "",
    openedBy: { uid: "u1", name: "A", email: "a@b.com", clinicId: "u1" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "aberto",
    priority: "media",
    classification: null,
    impact: "",
    assignee: { type: "bot", name: "Grok Bot" },
    github: {},
    bot: { state: "idle", attempts: 0 },
    review: { state: "pending" },
    version: 1,
    ...overrides,
  };
}

describe("bot queue eligibility", () => {
  it("excludes encerrado", () => {
    expect(isBotQueueEligible(baseTicket({ status: "encerrado" }))).toBe(false);
  });

  it("excludes paused bot", () => {
    expect(isBotQueueEligible(baseTicket({ bot: { state: "paused", attempts: 0 } }))).toBe(false);
  });

  it("excludes locked bot", () => {
    const now = Date.now();
    expect(
      isBotQueueEligible(
        baseTicket({
          bot: {
            state: "running",
            attempts: 0,
            lockId: "l1",
            lockExpiresAt: new Date(now + 60000).toISOString(),
          },
        }),
        now
      )
    ).toBe(false);
    expect(isBotLocked(baseTicket({ bot: { state: "running", attempts: 0, lockId: "l1", lockExpiresAt: new Date(now + 60000).toISOString() } }), now)).toBe(true);
  });
});
