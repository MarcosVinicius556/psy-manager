import { afterEach, describe, expect, it } from "vitest";
import { createOAuthState, verifyOAuthState } from "./oauth-state";

const PREV = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;

afterEach(() => {
  process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = PREV;
});

describe("state OAuth", () => {
  it("valida uid, nonce e expiração", () => {
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = "chave-de-teste";
    const nonce = "abc123";
    const state = createOAuthState("uid-1", nonce, 1_000_000);
    const ok = verifyOAuthState(state, "uid-1", nonce, 1_000_000);
    expect(ok.ok).toBe(true);
  });

  it("rejeita uid ou nonce incorretos", () => {
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = "chave-de-teste";
    const state = createOAuthState("uid-1", "nonce-a", 1_000_000);
    expect(verifyOAuthState(state, "uid-2", "nonce-a", 1_000_000).ok).toBe(false);
    expect(verifyOAuthState(state, "uid-1", "nonce-b", 1_000_000).ok).toBe(false);
  });

  it("rejeita state expirado", () => {
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = "chave-de-teste";
    const state = createOAuthState("uid-1", "nonce", 1_000_000);
    expect(verifyOAuthState(state, "uid-1", "nonce", 1_000_000 + 20 * 60 * 1000).ok).toBe(false);
  });
});
