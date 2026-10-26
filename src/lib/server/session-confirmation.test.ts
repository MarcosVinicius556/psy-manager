import { describe, expect, it } from "vitest";
import {
  reminderUnsubscribeToken,
  sessionReminderMarkerId,
  verifyReminderUnsubscribeToken,
} from "./session-confirmation";

describe("session confirmation helpers", () => {
  it("gera marcador idempotente por sessão e data", () => {
    expect(sessionReminderMarkerId("abc", "2026-10-27")).toBe("sessao_abc_lembrete_2026-10-27");
  });

  it("valida token de descadastro", () => {
    process.env.CRON_SECRET = "test-secret";
    const token = reminderUnsubscribeToken("owner", "patient");
    expect(verifyReminderUnsubscribeToken("owner", "patient", token)).toBe(true);
    expect(verifyReminderUnsubscribeToken("owner", "patient", "invalid")).toBe(false);
  });
});
