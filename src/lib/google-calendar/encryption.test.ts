import { afterEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "./encryption";

const PREV = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;

afterEach(() => {
  process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = PREV;
});

describe("criptografia de tokens", () => {
  it("criptografa e descriptografa com chave base64 de 32 bytes", () => {
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    const plain = "refresh-token-secreto";
    const encrypted = encryptSecret(plain);
    expect(encrypted).not.toContain(plain);
    expect(decryptSecret(encrypted)).toBe(plain);
  });

  it("aceita chave hex de 64 caracteres", () => {
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = "a".repeat(64);
    expect(decryptSecret(encryptSecret("outro-token"))).toBe("outro-token");
  });
});
