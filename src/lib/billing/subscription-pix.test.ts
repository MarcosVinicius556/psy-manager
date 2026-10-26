import { describe, expect, it } from "vitest";
import {
  BILLING_GRACE_DAYS,
  extendPaidUntilMillis,
  paymentReminderStage,
  renewalNoticesDue,
  subscriptionStatusAfterExpiry,
} from "./subscription-pix";
import { MS_DAY } from "@/lib/saas/model";

const NOW = Date.parse("2026-10-20T12:00:00.000Z");

describe("subscription pix lifecycle", () => {
  it("estende o período a partir do fim atual", () => {
    const current = NOW + 10 * MS_DAY;
    const next = extendPaidUntilMillis("consultorio", current, NOW);
    expect(next - current).toBe(30 * MS_DAY);
  });

  it("marca pendente após vencimento e atrasado após carência", () => {
    const paidUntil = NOW - MS_DAY;
    expect(subscriptionStatusAfterExpiry(paidUntil, NOW, "ativa")).toBe("pagamento_pendente");
    const paidLongAgo = NOW - (BILLING_GRACE_DAYS + 2) * MS_DAY;
    expect(subscriptionStatusAfterExpiry(paidLongAgo, NOW, "pagamento_pendente")).toBe("pagamento_atrasado");
  });

  it("avisa renovação em D-5 e D-0", () => {
    const paidUntil = NOW + 5 * MS_DAY;
    const due = renewalNoticesDue(
      { paidUntilMillis: paidUntil, subscriptionStatus: "ativa", billingAccess: "integral" },
      NOW,
      []
    );
    expect(due).toEqual(["renovacao_d5"]);
  });

  it("limita lembretes de cobrança a D0/D+1 e D+7", () => {
    expect(paymentReminderStage("2026-10-20", "2026-10-20", 0)).toBe("d0");
    expect(paymentReminderStage("2026-10-19", "2026-10-20", 0)).toBe("d1");
    expect(paymentReminderStage("2026-10-13", "2026-10-20", 1)).toBe("d7");
    expect(paymentReminderStage("2026-10-13", "2026-10-20", 2)).toBe(null);
  });
});
