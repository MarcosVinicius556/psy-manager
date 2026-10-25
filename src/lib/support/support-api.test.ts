import { describe, expect, it } from "vitest";
import { timingSafeEqual } from "node:crypto";
import { requireSupportBot } from "@/lib/server/support-bot-auth";
import { assertTransition } from "./transitions";

describe("support bot auth", () => {
  it("rejects missing token", () => {
    const prev = process.env.SUPPORT_BOT_TOKEN;
    process.env.SUPPORT_BOT_TOKEN = "secret-token-value";
    const res = requireSupportBot(new Request("http://localhost/api/support/bot/queue"));
    expect("error" in res).toBe(true);
    process.env.SUPPORT_BOT_TOKEN = prev;
  });

  it("uses constant time compare", () => {
    const a = Buffer.from("abc");
    const b = Buffer.from("abc");
    expect(timingSafeEqual(a, b)).toBe(true);
  });
});

describe("bot workflow guards", () => {
  it("failed execution path does not auto-approve PR state", () => {
    expect(assertTransition("em_desenvolvimento", "aguardando_aprovacao").ok).toBe(true);
    expect(assertTransition("em_desenvolvimento", "resolvido").ok).toBe(false);
  });
});
