import { afterEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "./encryption";

describe("email credential encryption", () => {
  afterEach(() => {
    delete process.env.EMAIL_CREDENTIALS_ENC_KEY;
  });

  it("round-trips secrets", () => {
    process.env.EMAIL_CREDENTIALS_ENC_KEY = "a".repeat(32);
    const plain = "refresh-token-xyz";
    const encrypted = encryptSecret(plain);
    expect(encrypted).not.toContain(plain);
    expect(decryptSecret(encrypted)).toBe(plain);
  });
});
