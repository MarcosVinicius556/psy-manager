import { describe, expect, it } from "vitest";
import { scrubSecrets, sanitizeTicketBody } from "./sanitize";

describe("scrubSecrets", () => {
  it("redacts bearer tokens", () => {
    expect(scrubSecrets("use Bearer abcdefghijklmnop")).toContain("[redacted]");
  });

  it("redacts github tokens", () => {
    expect(scrubSecrets("ghp_12345678901234567890123456789012")).toBe("[redacted-token]");
  });
});

describe("sanitizeTicketBody", () => {
  it("trims and limits length", () => {
    expect(sanitizeTicketBody("  hello  ")).toBe("hello");
  });
});
