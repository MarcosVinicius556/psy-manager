import { describe, expect, it, vi, beforeEach } from "vitest";
import { hashLinkCode } from "./link-codes";

describe("link code redeem expectations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("invalid codes do not reveal whether hash existed", () => {
    const invalid = hashLinkCode("ZZZZ9999");
    expect(invalid).not.toBe(hashLinkCode("ABCD1234"));
  });
});
