export const TRIAL_DAYS = 30;
export const MS_DAY = 24 * 60 * 60 * 1000;
export const TERMS_VERSION = "2026-10-20";
export const TRIAL_EXTEND_MAX_DAYS = 90;

export const SUBSCRIPTION_STATUSES = [
  "trial_ativo",
  "trial_expirado",
  "ativa",
  "pagamento_pendente",
  "pagamento_atrasado",
  "cancelada",
  "encerrada",
  "cortesia",
  "legado",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const ACCOUNT_STATUSES = ["ativa", "suspensa", "desativada"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const BILLING_ACCESS = ["trial", "integral", "restrito", "legado"] as const;
export type BillingAccess = (typeof BILLING_ACCESS)[number];

export type AccessMode = "full" | "restricted" | "blocked";

export type AccessDecision = {
  mode: AccessMode;
  reason: string;
};

export type PlanPeriod = "trial" | "mensal" | "anual";

export type PlanDefinition = {
  id: string;
  nome: string;
  descricao: string;
  precoCentavos: number | null;
  moeda: "BRL";
  periodicidade: PlanPeriod;
  trialDias: number;
  recursos: string[];
  limiteProfissionais: number | null;
  disponivel: boolean;
  ordem: number;
};

export type AccountRecord = {
  uid: string;
  email: string;
  nome: string;
  clinicName: string;
  role: "super_admin" | "psicologo";
  accountStatus: AccountStatus | "";
  subscriptionStatus: SubscriptionStatus | "";
  billingAccess: BillingAccess | "";
  planId: string;
  trialStartedAt: string;
  trialEndsAt: string;
  trialStartedAtMillis: number;
  trialEndsAtMillis: number;
  termsAcceptedAt: string;
  termsVersion: string;
  privacyAcknowledgedAt: string;
  checkoutStatus: "" | "aguardando_provedor";
  checkoutPlanId: string;
  checkoutRequestedAt: string;
  onboardingDismissed: boolean;
  operationalEmail: boolean;
  productEmail: boolean;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
};

export type AdminAction =
  | "estender_trial"
  | "encerrar_trial"
  | "alterar_plano"
  | "suspender"
  | "reativar"
  | "desativar"
  | "conceder_cortesia"
  | "encerrar_cortesia";

export type NoticeKind = "boas_vindas" | "trial_7" | "trial_3" | "trial_1" | "trial_expirado";

const RESOURCES = ["Agenda", "Pacientes", "Locais", "Financeiro", "Contratos", "Relatórios"];

export const DEFAULT_PLANS: PlanDefinition[] = [
  {
    id: "avaliacao",
    nome: "Avaliação",
    descricao: "Uso do painel durante o período de teste. Não há cobrança neste plano.",
    precoCentavos: null,
    moeda: "BRL",
    periodicidade: "trial",
    trialDias: TRIAL_DAYS,
    recursos: RESOURCES,
    limiteProfissionais: null,
    disponivel: true,
    ordem: 0,
  },
  {
    id: "consultorio",
    nome: "Consultório",
    descricao: "Uso contínuo do painel depois da avaliação. O valor ainda não foi definido e nenhuma cobrança é feita por aqui.",
    precoCentavos: null,
    moeda: "BRL",
    periodicidade: "mensal",
    trialDias: 0,
    recursos: RESOURCES,
    limiteProfissionais: null,
    disponivel: true,
    ordem: 1,
  },
];

export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trial_ativo: "Trial ativo",
  trial_expirado: "Trial expirado",
  ativa: "Assinatura ativa",
  pagamento_pendente: "Pagamento pendente",
  pagamento_atrasado: "Pagamento em atraso",
  cancelada: "Assinatura cancelada",
  encerrada: "Assinatura encerrada",
  cortesia: "Acesso cortesia",
  legado: "Conta anterior",
};

export const ACCOUNT_LABEL: Record<AccountStatus, string> = {
  ativa: "Ativa",
  suspensa: "Suspensa",
  desativada: "Desativada",
};

const FABRICATED: SubscriptionStatus[] = ["ativa", "pagamento_pendente", "pagamento_atrasado"];

export function isFabricatedStatus(status: string) {
  return FABRICATED.includes(status as SubscriptionStatus);
}

export function planById(plans: PlanDefinition[], id: string) {
  return plans.find((plan) => plan.id === id) ?? null;
}

export function formatPrice(cents: number | null) {
  if (cents == null) return "A definir";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function periodLabel(period: PlanPeriod) {
  if (period === "trial") return "período de teste";
  if (period === "anual") return "por ano";
  return "por mês";
}

export function trialWindow(now: number) {
  const start = now;
  const end = now + TRIAL_DAYS * MS_DAY;
  return {
    trialStartedAt: new Date(start).toISOString(),
    trialEndsAt: new Date(end).toISOString(),
    trialStartedAtMillis: start,
    trialEndsAtMillis: end,
  };
}

export function emptyAccount(uid: string, email: string): AccountRecord {
  return {
    uid,
    email,
    nome: "",
    clinicName: "",
    role: "psicologo",
    accountStatus: "",
    subscriptionStatus: "",
    billingAccess: "",
    planId: "",
    trialStartedAt: "",
    trialEndsAt: "",
    trialStartedAtMillis: 0,
    trialEndsAtMillis: 0,
    termsAcceptedAt: "",
    termsVersion: "",
    privacyAcknowledgedAt: "",
    checkoutStatus: "",
    checkoutPlanId: "",
    checkoutRequestedAt: "",
    onboardingDismissed: false,
    operationalEmail: true,
    productEmail: true,
    createdAt: "",
    updatedAt: "",
    lastSeenAt: "",
  };
}

export function buildTrialAccount(input: {
  uid: string;
  email: string;
  nome: string;
  clinicName: string;
  now: number;
  termsAcceptedAt: string;
}) {
  const window = trialWindow(input.now);
  return {
    uid: input.uid,
    email: input.email.trim().toLowerCase(),
    nome: input.nome.trim(),
    clinicName: input.clinicName.trim(),
    role: "psicologo" as const,
    accountStatus: "ativa" as const,
    subscriptionStatus: "trial_ativo" as const,
    billingAccess: "trial" as const,
    planId: "avaliacao",
    ...window,
    termsAcceptedAt: input.termsAcceptedAt,
    termsVersion: TERMS_VERSION,
    privacyAcknowledgedAt: input.termsAcceptedAt,
    checkoutStatus: "" as const,
    checkoutPlanId: "",
    checkoutRequestedAt: "",
    onboardingDismissed: false,
    operationalEmail: true,
    productEmail: true,
    createdAt: input.termsAcceptedAt,
    updatedAt: input.termsAcceptedAt,
    lastSeenAt: "",
  };
}

export function buildLegacyAccount(nowIso: string) {
  return {
    accountStatus: "ativa" as const,
    subscriptionStatus: "legado" as const,
    billingAccess: "legado" as const,
    planId: "legado",
    updatedAt: nowIso,
  };
}

export function buildReplayDeniedAccount(input: { uid: string; email: string; nome: string; clinicName: string; now: number; termsAcceptedAt: string }) {
  return {
    uid: input.uid,
    email: input.email.trim().toLowerCase(),
    nome: input.nome.trim(),
    clinicName: input.clinicName.trim(),
    role: "psicologo" as const,
    accountStatus: "ativa" as const,
    subscriptionStatus: "trial_expirado" as const,
    billingAccess: "restrito" as const,
    planId: "avaliacao",
    trialStartedAt: new Date(input.now).toISOString(),
    trialEndsAt: new Date(input.now).toISOString(),
    trialStartedAtMillis: input.now,
    trialEndsAtMillis: input.now,
    termsAcceptedAt: input.termsAcceptedAt,
    termsVersion: TERMS_VERSION,
    privacyAcknowledgedAt: input.termsAcceptedAt,
    checkoutStatus: "" as const,
    checkoutPlanId: "",
    checkoutRequestedAt: "",
    onboardingDismissed: false,
    operationalEmail: true,
    productEmail: true,
    createdAt: input.termsAcceptedAt,
    updatedAt: input.termsAcceptedAt,
    lastSeenAt: "",
  };
}

export function expirePatch(nowIso: string) {
  return {
    subscriptionStatus: "trial_expirado" as const,
    billingAccess: "restrito" as const,
    updatedAt: nowIso,
  };
}

export function resolveAccess(account: Pick<AccountRecord, "accountStatus" | "billingAccess" | "subscriptionStatus" | "trialEndsAtMillis">, now: number): AccessDecision {
  if (account.accountStatus === "suspensa") return { mode: "blocked", reason: "suspensa" };
  if (account.accountStatus === "desativada") return { mode: "blocked", reason: "desativada" };
  if (!account.billingAccess) return { mode: "full", reason: "sem_cobranca_registrada" };
  if (account.billingAccess === "legado" || account.billingAccess === "integral") {
    return { mode: "full", reason: account.billingAccess };
  }
  if (
    account.billingAccess === "trial" &&
    account.subscriptionStatus === "trial_ativo" &&
    account.trialEndsAtMillis > now
  ) {
    return { mode: "full", reason: "trial" };
  }
  return { mode: "restricted", reason: "assinatura_inativa" };
}

export function writesAllowed(account: Pick<AccountRecord, "accountStatus" | "billingAccess" | "subscriptionStatus" | "trialEndsAtMillis">, now: number) {
  return resolveAccess(account, now).mode === "full";
}

export function daysRemaining(trialEndsAtMillis: number, now: number) {
  if (!trialEndsAtMillis) return 0;
  return Math.max(0, Math.ceil((trialEndsAtMillis - now) / MS_DAY));
}

export function validateSignup(input: {
  nome: string;
  email: string;
  password: string;
  confirm: string;
  acceptTerms: boolean;
  honeypot: string;
}) {
  const nome = input.nome.trim();
  const email = input.email.trim().toLowerCase();
  if (input.honeypot.trim()) return { ok: false as const, message: "Não foi possível concluir o cadastro." };
  if (nome.length < 3 || nome.length > 120) return { ok: false as const, message: "Informe seu nome completo." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return { ok: false as const, message: "Informe um e-mail válido." };
  if (input.password.length < 8) return { ok: false as const, message: "A senha precisa ter pelo menos 8 caracteres." };
  if (input.password !== input.confirm) return { ok: false as const, message: "A confirmação da senha não confere." };
  if (!input.acceptTerms) return { ok: false as const, message: "Para continuar, aceite os termos e confirme que leu a política de privacidade." };
  return { ok: true as const, value: { nome, email, role: "psicologo" as const } };
}

export function noticesDue(account: Pick<AccountRecord, "billingAccess" | "subscriptionStatus" | "trialEndsAtMillis">, now: number, existingIds: string[]) {
  const due: NoticeKind[] = [];
  if (account.billingAccess === "trial" && !existingIds.includes("boas_vindas")) due.push("boas_vindas");
  const tracked = account.billingAccess === "trial" || account.subscriptionStatus === "trial_ativo" || account.subscriptionStatus === "trial_expirado";
  if (!tracked || !account.trialEndsAtMillis) return due;
  const end = account.trialEndsAtMillis;
  if (now >= end) {
    if (!existingIds.includes("trial_expirado")) due.push("trial_expirado");
    return due;
  }
  const daysLeft = (end - now) / MS_DAY;
  const bucket: NoticeKind | null = daysLeft <= 1 ? "trial_1" : daysLeft <= 3 ? "trial_3" : daysLeft <= 7 ? "trial_7" : null;
  if (bucket && !existingIds.includes(bucket)) due.push(bucket);
  return due;
}

export function noticeContent(kind: NoticeKind, account: Pick<AccountRecord, "nome" | "trialEndsAt">) {
  const nome = account.nome.trim() || "olá";
  if (kind === "boas_vindas") {
    return {
      categoria: "operacional" as const,
      titulo: "Bem-vindo à Psy Manager",
      corpo: `${nome}, sua conta foi criada com ${TRIAL_DAYS} dias de avaliação. O fim do período é ${account.trialEndsAt ? new Date(account.trialEndsAt).toLocaleString("pt-BR") : "a data registrada na sua conta"}. Nenhuma cobrança foi feita.`,
    };
  }
  if (kind === "trial_expirado") {
    return {
      categoria: "operacional" as const,
      titulo: "Seu período de avaliação terminou",
      corpo: "Novos lançamentos ficam pausados. Pacientes, agenda e financeiro já cadastrados continuam salvos. A contratação só avança quando houver confirmação de pagamento — hoje o provedor ainda não está ligado.",
    };
  }
  const days = kind === "trial_1" ? "1 dia" : kind === "trial_3" ? "3 dias" : "7 dias";
  return {
    categoria: "operacional" as const,
    titulo: `Sua avaliação termina em ${days}`,
    corpo: `O acesso completo segue até ${account.trialEndsAt ? new Date(account.trialEndsAt).toLocaleString("pt-BR") : "a data de término"}. Depois disso, os dados permanecem e os novos lançamentos param até a regularização.`,
  };
}

export function applyAdminAction(
  account: AccountRecord,
  action: AdminAction,
  input: { days?: number; planId?: string; now: number }
) {
  const nowIso = new Date(input.now).toISOString();
  const next: AccountRecord = { ...account, updatedAt: nowIso };
  if (account.role === "super_admin") {
    throw new Error("A conta do proprietário não entra neste fluxo.");
  }
  if (action === "suspender") {
    if (account.accountStatus === "desativada") throw new Error("Reative a conta antes de suspender, ou mantenha a desativação.");
    if (account.accountStatus === "suspensa") throw new Error("A conta já está suspensa.");
    next.accountStatus = "suspensa";
    return { account: next, summary: "Conta suspensa. A assinatura não foi apagada e os dados clínicos não foram alterados." };
  }
  if (action === "desativar") {
    if (account.accountStatus === "desativada") throw new Error("A conta já está desativada.");
    next.accountStatus = "desativada";
    return { account: next, summary: "Conta desativada. Isso não exclui pacientes, prontuários ou financeiro." };
  }
  if (action === "reativar") {
    if (account.accountStatus !== "suspensa" && account.accountStatus !== "desativada") {
      throw new Error("Só uma conta suspensa ou desativada pode ser reativada.");
    }
    next.accountStatus = "ativa";
    return { account: next, summary: "Conta reativada. O estado da assinatura foi mantido." };
  }
  if (account.accountStatus === "desativada") throw new Error("Reative a conta antes de alterar o plano ou o trial.");
  if (action === "alterar_plano") {
    const planId = input.planId?.trim() || "";
    if (!planId || planId === "legado") throw new Error("Escolha um plano disponível.");
    if (isFabricatedStatus(next.subscriptionStatus)) throw new Error("Esta situação comercial não pode ser alterada por aqui.");
    next.planId = planId;
    return { account: next, summary: "Plano alterado sem registrar pagamento e sem marcar a assinatura como paga." };
  }
  if (action === "estender_trial") {
    const allowed: Array<SubscriptionStatus | ""> = ["trial_ativo", "trial_expirado", "cancelada"];
    if (!allowed.includes(account.subscriptionStatus)) throw new Error("Este trial só pode ser estendido em contas que já estão em avaliação, expiradas ou canceladas.");
    const days = Math.floor(input.days || 0);
    if (days < 1 || days > TRIAL_EXTEND_MAX_DAYS) throw new Error(`Informe de 1 a ${TRIAL_EXTEND_MAX_DAYS} dias.`);
    const base = Math.max(input.now, account.trialEndsAtMillis || 0);
    const end = base + days * MS_DAY;
    next.subscriptionStatus = "trial_ativo";
    next.billingAccess = "trial";
    next.planId = account.planId && account.planId !== "legado" ? account.planId : "avaliacao";
    next.trialEndsAtMillis = end;
    next.trialEndsAt = new Date(end).toISOString();
    if (!next.trialStartedAtMillis) {
      next.trialStartedAtMillis = input.now;
      next.trialStartedAt = nowIso;
    }
    return { account: next, summary: `Trial estendido por ${days} dias, até ${new Date(end).toLocaleString("pt-BR")}. Nenhum pagamento foi registrado.` };
  }
  if (action === "encerrar_trial") {
    if (account.subscriptionStatus !== "trial_ativo") throw new Error("Só um trial ativo pode ser encerrado antecipadamente.");
    next.subscriptionStatus = "trial_expirado";
    next.billingAccess = "restrito";
    next.trialEndsAtMillis = input.now;
    next.trialEndsAt = nowIso;
    return { account: next, summary: "Trial encerrado. Novos lançamentos ficam bloqueados e os dados existentes permanecem." };
  }
  if (action === "conceder_cortesia") {
    const planId = input.planId?.trim() || account.planId || "consultorio";
    if (planId === "legado") throw new Error("Escolha o plano da cortesia.");
    next.subscriptionStatus = "cortesia";
    next.billingAccess = "integral";
    next.planId = planId;
    next.accountStatus = "ativa";
    return { account: next, summary: "Acesso cortesia concedido pelo proprietário. Isto não é uma assinatura paga nem um pagamento recebido." };
  }
  if (action === "encerrar_cortesia") {
    if (account.subscriptionStatus !== "cortesia") throw new Error("Não há cortesia ativa nesta conta.");
    next.subscriptionStatus = "encerrada";
    next.billingAccess = "restrito";
    return { account: next, summary: "Cortesia encerrada. A conta continua cadastrada e os dados clínicos não foram excluídos." };
  }
  throw new Error("Ação administrativa desconhecida.");
}

export function userCancelPatch(account: AccountRecord, nowIso: string) {
  const cancellable: Array<SubscriptionStatus | ""> = ["trial_ativo", "cortesia"];
  if (!cancellable.includes(account.subscriptionStatus)) {
    throw new Error("Não há uma avaliação ou cortesia ativa para cancelar. Nenhuma cobrança foi localizada.");
  }
  return {
    subscriptionStatus: "cancelada" as const,
    billingAccess: "restrito" as const,
    updatedAt: nowIso,
  };
}

export function checkoutPatch(planId: string, nowIso: string) {
  if (!planId || planId === "avaliacao" || planId === "legado") throw new Error("Escolha o plano de uso contínuo.");
  return {
    checkoutStatus: "aguardando_provedor" as const,
    checkoutPlanId: planId,
    checkoutRequestedAt: nowIso,
    updatedAt: nowIso,
  };
}

export type AccountMetrics = {
  total: number;
  trialsAtivos: number;
  trialsPerto: number;
  trialsExpirados: number;
  ativas: number;
  canceladas: number;
  checkoutsAbertos: number;
  suspensas: number;
  desativadas: number;
  legado: number;
  cortesias: number;
  novosNoPeriodo: number;
  contratadoCentavos: number;
  recebidoCentavos: number;
  ativasSemPreco: number;
  conversoesConfirmadas: number;
  coorteTrial: number;
};

export function summarizeAccounts(accounts: AccountRecord[], plans: PlanDefinition[], now: number, periodStart: number | null): AccountMetrics {
  const metrics: AccountMetrics = {
    total: 0,
    trialsAtivos: 0,
    trialsPerto: 0,
    trialsExpirados: 0,
    ativas: 0,
    canceladas: 0,
    checkoutsAbertos: 0,
    suspensas: 0,
    desativadas: 0,
    legado: 0,
    cortesias: 0,
    novosNoPeriodo: 0,
    contratadoCentavos: 0,
    recebidoCentavos: 0,
    ativasSemPreco: 0,
    conversoesConfirmadas: 0,
    coorteTrial: 0,
  };
  for (const account of accounts) {
    if (account.role === "super_admin") continue;
    metrics.total += 1;
    const created = Date.parse(account.createdAt);
    if (periodStart == null || (Number.isFinite(created) && created >= periodStart)) metrics.novosNoPeriodo += 1;
    if (account.accountStatus === "suspensa") metrics.suspensas += 1;
    if (account.accountStatus === "desativada") metrics.desativadas += 1;
    if (account.checkoutStatus === "aguardando_provedor") metrics.checkoutsAbertos += 1;
    if (account.subscriptionStatus === "legado" || account.billingAccess === "legado") metrics.legado += 1;
    if (account.subscriptionStatus === "cortesia") metrics.cortesias += 1;
    if (account.subscriptionStatus === "cancelada") metrics.canceladas += 1;
    if (account.subscriptionStatus === "ativa") {
      metrics.ativas += 1;
      metrics.conversoesConfirmadas += 1;
      const plan = planById(plans, account.planId);
      const monthly = plan ? monthlyCents(plan) : null;
      if (monthly == null) metrics.ativasSemPreco += 1;
      else metrics.contratadoCentavos += monthly;
    }
    const onTrial = account.subscriptionStatus === "trial_ativo" && account.trialEndsAtMillis > now;
    if (onTrial) {
      metrics.trialsAtivos += 1;
      if (account.trialEndsAtMillis - now <= 7 * MS_DAY) metrics.trialsPerto += 1;
    }
    if (account.subscriptionStatus === "trial_expirado" || (account.subscriptionStatus === "trial_ativo" && account.trialEndsAtMillis > 0 && account.trialEndsAtMillis <= now)) {
      metrics.trialsExpirados += 1;
    }
    if (account.billingAccess === "trial" || account.subscriptionStatus === "trial_ativo" || account.subscriptionStatus === "trial_expirado" || (account.subscriptionStatus === "cancelada" && account.planId === "avaliacao")) {
      metrics.coorteTrial += 1;
    }
  }
  return metrics;
}

function monthlyCents(plan: PlanDefinition) {
  if (plan.precoCentavos == null) return null;
  if (plan.periodicidade === "anual") return Math.round(plan.precoCentavos / 12);
  if (plan.periodicidade === "mensal") return plan.precoCentavos;
  return null;
}

function dayKey(value: number) {
  const day = new Date(value);
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const date = String(day.getDate()).padStart(2, "0");
  return `${day.getFullYear()}-${month}-${date}`;
}

export function signupBuckets(accounts: AccountRecord[], now: number, days: number) {
  const buckets = Array.from({ length: days }, (_, index) => {
    const key = dayKey(now - (days - 1 - index) * MS_DAY);
    return { key, label: key.slice(8, 10) + "/" + key.slice(5, 7), total: 0 };
  });
  const index = new Map(buckets.map((bucket, position) => [bucket.key, position]));
  for (const account of accounts) {
    if (account.role === "super_admin" || !account.createdAt) continue;
    const parsed = Date.parse(account.createdAt);
    if (!Number.isFinite(parsed)) continue;
    const position = index.get(dayKey(parsed));
    if (position != null) buckets[position].total += 1;
  }
  return buckets;
}

export function matchesAccountFilter(account: AccountRecord, filter: string, now: number) {
  if (account.role === "super_admin") return false;
  if (filter === "todos") return true;
  if (filter === "trials_ativos") return account.subscriptionStatus === "trial_ativo" && account.trialEndsAtMillis > now;
  if (filter === "trials_expirados") return account.subscriptionStatus === "trial_expirado" || (account.subscriptionStatus === "trial_ativo" && account.trialEndsAtMillis <= now);
  if (filter === "pagantes") return account.subscriptionStatus === "ativa";
  if (filter === "pagamento") return account.subscriptionStatus === "pagamento_pendente" || account.subscriptionStatus === "pagamento_atrasado" || account.checkoutStatus === "aguardando_provedor";
  if (filter === "canceladas") return account.subscriptionStatus === "cancelada" || account.subscriptionStatus === "encerrada";
  if (filter === "suspensas") return account.accountStatus === "suspensa" || account.accountStatus === "desativada";
  return true;
}
