import { describe, expect, it } from "vitest";
import { isValidPublicToken, sanitizeSignerName } from "./public-token";

describe("public-token", () => {
  it("aceita UUID v4", () => {
    expect(isValidPublicToken("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("sanitiza nome", () => {
    expect(sanitizeSignerName("  Ana   Demo  ")).toBe("Ana Demo");
  });
});
