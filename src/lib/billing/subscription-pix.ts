import { PUBLIC_BILLING } from "./plans";

export const BILLING_GRACE_DAYS = 3;

export const SUBSCRIPTION_PLAN_IDS = ["consultorio", "consultorio_anual"] as const;
export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLAN_IDS)[number];

export function subscriptionPlanAmountCents(planId: string) {
  if (planId === "consultorio_anual") return PUBLIC_BILLING.annualCents;
  if (planId === "consultorio") return PUBLIC_BILLING.monthlyCents;
  return null;
}

export function subscriptionPeriodDays(planId: string) {
  if (planId === "consultorio_anual") return 365;
  if (planId === "consultorio") return 30;
  return 0;
}

export function subscriptionPixTxid(uid: string, planId: string) {
  const slug = uid.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12);
  const plan = planId === "consultorio_anual" ? "A" : "M";
  const base = `PSYSUB${plan}${slug}`.slice(0, 25);
  return base || "PSYSUBSCRIPTION";
}

export function extendPaidUntilMillis(planId: string, currentPaidUntil: number, now: number) {
  const days = subscriptionPeriodDays(planId);
  if (!days) throw new Error("Plano inválido para renovação.");
  const base = Math.max(now, currentPaidUntil > 0 ? currentPaidUntil : 0);
  return base + days * 24 * 60 * 60 * 1000;
}

export function daysUntilPaidUntil(paidUntilMillis: number, now: number) {
  if (!paidUntilMillis) return null;
  return Math.ceil((paidUntilMillis - now) / (24 * 60 * 60 * 1000));
}

export function daysAfterPaidUntil(paidUntilMillis: number, now: number) {
  if (!paidUntilMillis || now <= paidUntilMillis) return 0;
  return Math.floor((now - paidUntilMillis) / (24 * 60 * 60 * 1000));
}

export type RenewalNoticeKind = "renovacao_d5" | "renovacao_d0";

export function renewalNoticesDue(
  account: { paidUntilMillis: number; subscriptionStatus: string; billingAccess: string; operationalEmail?: boolean },
  now: number,
  existingIds: string[]
): RenewalNoticeKind[] {
  const due: RenewalNoticeKind[] = [];
  if (account.billingAccess !== "integral") return due;
  if (!["ativa", "pagamento_pendente", "pagamento_atrasado"].includes(account.subscriptionStatus)) return due;
  if (!account.paidUntilMillis) return due;
  const daysLeft = daysUntilPaidUntil(account.paidUntilMillis, now);
  if (daysLeft == null) return due;
  if (daysLeft === 5 && !existingIds.includes("renovacao_d5")) due.push("renovacao_d5");
  if (daysLeft === 0 && !existingIds.includes("renovacao_d0")) due.push("renovacao_d0");
  return due;
}

export function subscriptionStatusAfterExpiry(
  paidUntilMillis: number,
  now: number,
  current: string
): "pagamento_pendente" | "pagamento_atrasado" | null {
  if (!paidUntilMillis || now <= paidUntilMillis) return null;
  const overdueDays = daysAfterPaidUntil(paidUntilMillis, now);
  if (overdueDays > BILLING_GRACE_DAYS) {
    return current === "pagamento_atrasado" ? null : "pagamento_atrasado";
  }
  if (current === "ativa") return "pagamento_pendente";
  return null;
}

export type PaymentReminderStage = "d0" | "d1" | "d7";

export function paymentReminderStage(dueDateYmd: string, todayYmd: string, lembretesEnviados: number): PaymentReminderStage | null {
  if (lembretesEnviados >= 2) return null;
  const due = Date.parse(`${dueDateYmd}T12:00:00.000Z`);
  const today = Date.parse(`${todayYmd}T12:00:00.000Z`);
  if (!Number.isFinite(due) || !Number.isFinite(today)) return null;
  const daysSinceDue = Math.floor((today - due) / (24 * 60 * 60 * 1000));
  if (lembretesEnviados === 0) {
    if (daysSinceDue === 0) return "d0";
    if (daysSinceDue === 1) return "d1";
    return null;
  }
  if (lembretesEnviados === 1 && daysSinceDue === 7) return "d7";
  return null;
}

export function paymentReminderMarkerId(paymentId: string, stage: PaymentReminderStage) {
  return `payment_reminder_${paymentId}_${stage}`;
}
