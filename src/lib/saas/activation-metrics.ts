import type { ActivationEventName, ActivationEventRecord } from "./activation-events";
import type { AccountRecord } from "./model";

const FUNNEL: ActivationEventName[] = [
  "signup",
  "horarios_definidos",
  "primeiro_paciente",
  "primeira_sessao_concluida",
  "primeiro_pagamento",
  "ativo_7_dias",
];

const FUNNEL_LABEL: Record<ActivationEventName, string> = {
  signup: "Cadastro",
  horarios_definidos: "Horários definidos",
  primeiro_paciente: "Primeiro paciente",
  primeira_sessao_concluida: "Primeira sessão concluída",
  primeiro_pagamento: "Primeiro pagamento",
  ativo_7_dias: "Ativo 7 dias",
};

export type FunnelStep = { event: ActivationEventName; label: string; count: number };

export type ActivationMetricsSummary = {
  funnel: FunnelStep[];
  trialToPaid: { trials: number; paid: number; rate: number | null };
  medianDaysToFirstSession: number | null;
  atRisk: AtRiskAccount[];
};

export type AtRiskAccount = {
  uid: string;
  email: string;
  nome: string;
  trialDaysLeft: number;
  reasons: string[];
};

const MS_DAY = 24 * 60 * 60 * 1000;

export function summarizeActivationMetrics(
  events: ActivationEventRecord[],
  accounts: AccountRecord[],
  now: number
): ActivationMetricsSummary {
  const byAccount = new Map<string, Partial<Record<ActivationEventName, string>>>();
  for (const item of events) {
    const bucket = byAccount.get(item.accountId) ?? {};
    bucket[item.event] = item.at;
    byAccount.set(item.accountId, bucket);
  }

  const funnel: FunnelStep[] = FUNNEL.map((event) => ({
    event,
    label: FUNNEL_LABEL[event],
    count: events.filter((item) => item.event === event).length,
  }));

  const trials = accounts.filter(
    (account) =>
      account.subscriptionStatus === "trial_ativo" ||
      account.subscriptionStatus === "trial_expirado" ||
      account.billingAccess === "trial"
  ).length;
  const paid = accounts.filter((account) => account.subscriptionStatus === "ativa").length;
  const rate = trials > 0 ? Math.round((paid / trials) * 1000) / 10 : null;

  const durations: number[] = [];
  for (const [, timeline] of byAccount) {
    const signupAt = timeline.signup;
    const sessionAt = timeline.primeira_sessao_concluida;
    if (!signupAt || !sessionAt) continue;
    const delta = Date.parse(sessionAt) - Date.parse(signupAt);
    if (Number.isFinite(delta) && delta >= 0) durations.push(delta / MS_DAY);
  }
  durations.sort((a, b) => a - b);
  const medianDaysToFirstSession =
    durations.length === 0
      ? null
      : durations.length % 2 === 1
        ? durations[(durations.length - 1) / 2]
        : (durations[durations.length / 2 - 1] + durations[durations.length / 2]) / 2;

  const atRisk: AtRiskAccount[] = [];
  for (const account of accounts) {
    if (account.role === "super_admin") continue;
    if (account.subscriptionStatus !== "trial_ativo" || account.trialEndsAtMillis <= now) continue;
    const daysLeft = Math.ceil((account.trialEndsAtMillis - now) / MS_DAY);
    if (daysLeft > 7) continue;
    const timeline = byAccount.get(account.uid) ?? {};
    const reasons: string[] = [];
    if (!timeline.horarios_definidos) reasons.push("Sem horários definidos");
    if (!timeline.primeiro_paciente) reasons.push("Sem paciente cadastrado");
    if (!timeline.primeira_sessao_concluida) reasons.push("Nenhuma sessão concluída");
    const lastSeen = Date.parse(account.lastSeenAt || account.createdAt);
    if (Number.isFinite(lastSeen) && now - lastSeen > 14 * MS_DAY) reasons.push("Pouco acesso recente");
    if (reasons.length === 0) reasons.push("Trial perto do fim");
    atRisk.push({
      uid: account.uid,
      email: account.email,
      nome: account.nome.trim() || account.email,
      trialDaysLeft: daysLeft,
      reasons,
    });
  }
  atRisk.sort((a, b) => a.trialDaysLeft - b.trialDaysLeft);

  return { funnel, trialToPaid: { trials, paid, rate }, medianDaysToFirstSession, atRisk };
}
