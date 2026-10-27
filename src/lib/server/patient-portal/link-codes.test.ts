import { describe, expect, it } from "vitest";
import { formatLinkCode, hashLinkCode, normalizeLinkCodeInput } from "./link-codes";

describe("patient link codes", () => {
  it("normalizes and hashes codes consistently", () => {
    const plain = "abcd1234";
    expect(normalizeLinkCodeInput("ABCD-1234")).toBe("ABCD1234");
    expect(formatLinkCode(plain)).toBe("ABCD-1234");
    expect(hashLinkCode("abcd-1234")).toBe(hashLinkCode("ABCD1234"));
  });
});
