import { describe, expect, it } from "vitest";
import { buildWorkflowSteps, mergeActivity } from "./workflow";
import type { SupportHistoryEvent, SupportTicketMessage, SupportTicketRecord } from "./types";

const baseTicket: SupportTicketRecord = {
  id: "t1",
  humanId: "CH-000001",
  title: "Bug",
  description: "d",
  extraInfo: "",
  impact: "",
  openedBy: { uid: "u1", name: "Ana", email: "a@test.com", clinicId: "c" },
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-25T12:00:00.000Z",
  status: "em_analise",
  priority: "media",
  classification: "simples",
  assignee: { type: "bot", name: "Grok Bot" },
  github: {},
  bot: { state: "idle", attempts: 0 },
  review: { state: "pending" },
  version: 2,
};

describe("buildWorkflowSteps", () => {
  it("marks triage as current for em_analise", () => {
    const steps = buildWorkflowSteps(baseTicket, []);
    const current = steps.find((s) => s.state === "current");
    expect(current?.id).toBe("triage");
  });
});

describe("mergeActivity", () => {
  it("sorts messages and history chronologically", () => {
    const messages: SupportTicketMessage[] = [
      {
        id: "m2",
        authorType: "user",
        authorId: "u1",
        authorName: "Ana",
        body: "b",
        attachments: [],
        source: "app",
        createdAt: "2026-10-02T10:00:00.000Z",
      },
    ];
    const history: SupportHistoryEvent[] = [
      {
        id: "h1",
        type: "status_change",
        actor: { uid: "b", name: "Bot", role: "bot" },
        at: "2026-10-01T11:00:00.000Z",
        to: { status: "em_analise" },
      },
    ];
    const items = mergeActivity(messages, history);
    expect(items.map((i) => i.id)).toEqual(["hist-h1", "msg-m2"]);
  });
});
