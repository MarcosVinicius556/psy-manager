import { describe, expect, it } from "vitest";
import { isFirestoreMissingIndexError, sortTicketsByUpdatedAtDesc } from "./list-queries";
import type { SupportTicketRecord } from "./types";

function ticket(id: string, updatedAt: string): SupportTicketRecord {
  return {
    id,
    humanId: `CH-${id}`,
    title: "t",
    description: "d",
    extraInfo: "",
    impact: "",
    openedBy: { uid: "u1", name: "n", email: "e", clinicId: "c" },
    createdAt: updatedAt,
    updatedAt,
    status: "aberto",
    priority: "media",
    classification: null,
    assignee: { type: "bot", name: "Grok Bot" },
    github: {},
    bot: { state: "idle", attempts: 0 },
    review: { state: "pending" },
    version: 1,
  };
}

describe("sortTicketsByUpdatedAtDesc", () => {
  it("orders newest first", () => {
    const sorted = sortTicketsByUpdatedAtDesc([
      ticket("a", "2026-01-01T00:00:00.000Z"),
      ticket("b", "2026-02-01T00:00:00.000Z"),
    ]);
    expect(sorted.map((t) => t.id)).toEqual(["b", "a"]);
  });
});

describe("isFirestoreMissingIndexError", () => {
  it("detects grpc failed precondition", () => {
    expect(isFirestoreMissingIndexError({ code: 9, message: "x" })).toBe(true);
  });

  it("detects index hint in message", () => {
    expect(isFirestoreMissingIndexError(new Error("The query requires an index"))).toBe(true);
  });

  it("ignores other errors", () => {
    expect(isFirestoreMissingIndexError(new Error("permission denied"))).toBe(false);
  });
});
