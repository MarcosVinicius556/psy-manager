import { describe, expect, it } from "vitest";
import { isValidPublicToken, sanitizeSignerName } from "./public-token";

describe("public-token", () => {
  it("aceita UUID v4", () => {
    const token = crypto.randomUUID();
    expect(isValidPublicToken(token)).toBe(true);
  });

  it("sanitiza nome", () => {
    expect(sanitizeSignerName("  Ana   Demo  ")).toBe("Ana Demo");
  });
});
