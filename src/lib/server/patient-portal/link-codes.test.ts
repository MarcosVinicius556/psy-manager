import { describe, expect, it } from "vitest";
import { formatLinkCode, hashLinkCode, normalizeLinkCodeInput } from "./link-codes";

describe("patient link codes", () => {
  it("filters pending codes by owner after patientId query", async () => {
    const { findLatestPendingLinkCodeMeta } = await import("./link-codes");
    const docs = [
      { data: () => ({ ownerUid: "psy-a", patientId: "pat-1", status: "pendente", expiresAtMillis: 100 }) },
      { data: () => ({ ownerUid: "psy-b", patientId: "pat-1", status: "pendente", expiresAtMillis: 200 }) },
    ];
    const db = {
      collection: () => ({
        where: () => ({
          limit: () => ({
            get: async () => ({ docs }),
          }),
        }),
      }),
    };
    const meta = await findLatestPendingLinkCodeMeta(db as never, "psy-b", "pat-1");
    expect(meta?.expiresAtMillis).toBe(200);
  });

  it("normalizes and hashes codes consistently", () => {
    const plain = "abcd1234";
    expect(normalizeLinkCodeInput("ABCD-1234")).toBe("ABCD1234");
    expect(formatLinkCode(plain)).toBe("ABCD-1234");
    expect(hashLinkCode("abcd-1234")).toBe(hashLinkCode("ABCD1234"));
  });
});
