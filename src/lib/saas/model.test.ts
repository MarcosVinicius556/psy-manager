import { describe, expect, it } from "vitest";
import {
  TRIAL_DAYS,
  MS_DAY,
  applyAdminAction,
  buildLegacyAccount,
  buildTrialAccount,
  checkoutPatch,
  daysRemaining,
  emptyAccount,
  isFabricatedStatus,
  matchesAccountFilter,
  noticesDue,
  resolveAccess,
  summarizeAccounts,
  trialWindow,
  userCancelPatch,
  validateSignup,
  writesAllowed,
  type AccountRecord,
  type PlanDefinition,
} from "./model";

const NOW = Date.parse("2026-10-20T15:00:00.000Z");

function trialAccount(overrides: Partial<AccountRecord> = {}): AccountRecord {
  const built = buildTrialAccount({
    uid: "u1",
    email: "ana@example.com",
    nome: "Ana Lima",
    clinicName: "Consultório Ana",
    now: NOW,
    termsAcceptedAt: new Date(NOW).toISOString(),
  });
  return { ...emptyAccount("u1", "ana@example.com"), ...built, ...overrides };
}

describe("cadastro", () => {
  it("aceita um cadastro mínimo e força o perfil de psicólogo", () => {
    const result = validateSignup({
      nome: "Ana Lima",
      email: "Ana@Example.com",
      password: "senha-segura",
      confirm: "senha-segura",
      acceptTerms: true,
      acceptDpa: true,
      honeypot: "",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.role).toBe("psicologo");
      expect(result.value.email).toBe("ana@example.com");
      expect(result.value).not.toHaveProperty("clinicName");
    }
  });

  it("recusa senha curta, e-mail inválido, termos ausentes e campo de abuso", () => {
    expect(validateSignup({ nome: "Ana", email: "ana@example.com", password: "curta", confirm: "curta", acceptTerms: true, acceptDpa: true, honeypot: "" }).ok).toBe(false);
    expect(validateSignup({ nome: "Ana Lima", email: "ana", password: "senha-segura", confirm: "senha-segura", acceptTerms: true, acceptDpa: true, honeypot: "" }).ok).toBe(false);
    expect(validateSignup({ nome: "Ana Lima", email: "ana@example.com", password: "senha-segura", confirm: "outra-senha", acceptTerms: true, acceptDpa: true, honeypot: "" }).ok).toBe(false);
    expect(validateSignup({ nome: "Ana Lima", email: "ana@example.com", password: "senha-segura", confirm: "senha-segura", acceptTerms: false, acceptDpa: true, honeypot: "" }).ok).toBe(false);
    expect(validateSignup({ nome: "Ana Lima", email: "ana@example.com", password: "senha-segura", confirm: "senha-segura", acceptTerms: true, acceptDpa: false, honeypot: "" }).ok).toBe(false);
    expect(validateSignup({ nome: "Ana Lima", email: "ana@example.com", password: "senha-segura", confirm: "senha-segura", acceptTerms: true, acceptDpa: true, honeypot: "http://spam" }).ok).toBe(false);
  });
});

describe("trial", () => {
  it("abre uma janela de 30 dias a partir do instante do cadastro", () => {
    const window = trialWindow(NOW);
    expect(window.trialEndsAtMillis - window.trialStartedAtMillis).toBe(TRIAL_DAYS * 24 * 60 * 60 * 1000);
    expect(daysRemaining(window.trialEndsAtMillis, NOW)).toBe(30);
  });

  it("libera o painel durante o trial e restringe depois do prazo, mesmo com status desatualizado", () => {
    const account = trialAccount();
    expect(writesAllowed(account, NOW + 1000)).toBe(true);
    expect(resolveAccess(account, account.trialEndsAtMillis + 1).mode).toBe("restricted");
  });

  it("não coloca conta antiga em trial", () => {
    const legacy = { ...emptyAccount("old", "old@example.com"), ...buildLegacyAccount(new Date(NOW).toISOString()) };
    expect(resolveAccess(legacy, NOW).mode).toBe("full");
    expect(legacy.subscriptionStatus).toBe("legado");
  });

  it("mantém acesso integral enquanto a cobrança ainda não foi registrada no documento", () => {
    expect(resolveAccess(emptyAccount("old", "old@example.com"), NOW).mode).toBe("full");
  });

  it("separa suspensão da conta do fim do trial", () => {
    const suspended = trialAccount({ accountStatus: "suspensa" });
    expect(resolveAccess(suspended, NOW).mode).toBe("blocked");
    const expired = trialAccount({ subscriptionStatus: "trial_expirado", billingAccess: "restrito", trialEndsAtMillis: NOW - 1 });
    expect(resolveAccess(expired, NOW)).toEqual({ mode: "restricted", reason: "assinatura_inativa" });
  });

  it("calcula o aviso mais próximo sem repetir chaves já enviadas", () => {
    const account = trialAccount();
    const almost = account.trialEndsAtMillis - 2 * 24 * 60 * 60 * 1000;
    expect(noticesDue(account, NOW, [])).toContain("boas_vindas");
    expect(noticesDue(account, almost, ["boas_vindas"])).toEqual(["trial_3"]);
    expect(noticesDue(account, almost, ["boas_vindas", "trial_3"])).toEqual([]);
    expect(noticesDue(account, account.trialEndsAtMillis + 1, ["boas_vindas"])).toEqual(["trial_expirado"]);
  });
});

describe("assinatura e administração", () => {
  it("não marca checkout como pago", () => {
    const patch = checkoutPatch("consultorio", new Date(NOW).toISOString());
    expect(patch.checkoutStatus).toBe("aguardando_provedor");
    expect("subscriptionStatus" in patch).toBe(false);
  });

  it("cancelar o trial restringe novos lançamentos", () => {
    const patch = userCancelPatch(trialAccount(), new Date(NOW).toISOString());
    expect(patch.subscriptionStatus).toBe("cancelada");
    expect(patch.billingAccess).toBe("restrito");
  });

  it("cancelar assinatura ativa agenda fim do período", () => {
    const paidUntil = NOW + 20 * MS_DAY;
    const account = {
      ...trialAccount(),
      subscriptionStatus: "ativa" as const,
      billingAccess: "integral" as const,
      paidUntilMillis: paidUntil,
      cancelAtPeriodEnd: false,
      accessUntilMillis: 0,
    };
    const patch = userCancelPatch(account, new Date(NOW).toISOString());
    expect(patch.cancelAtPeriodEnd).toBe(true);
    expect(patch.accessUntilMillis).toBe(paidUntil);
    expect(patch.subscriptionStatus).toBe("ativa");
  });

  it("impede o administrador de fabricar assinatura paga ao trocar o plano", () => {
    const changed = applyAdminAction(trialAccount(), "alterar_plano", { planId: "consultorio", now: NOW });
    expect(changed.account.planId).toBe("consultorio");
    expect(changed.account.subscriptionStatus).toBe("trial_ativo");
    expect(isFabricatedStatus(changed.account.subscriptionStatus)).toBe(false);
  });

  it("estende e encerra o trial sem apagar a conta", () => {
    const extended = applyAdminAction(trialAccount({ subscriptionStatus: "trial_expirado", billingAccess: "restrito" }), "estender_trial", { days: 10, now: NOW });
    expect(extended.account.subscriptionStatus).toBe("trial_ativo");
    expect(extended.account.trialEndsAtMillis).toBeGreaterThan(NOW);
    const closed = applyAdminAction(trialAccount(), "encerrar_trial", { now: NOW });
    expect(closed.account.subscriptionStatus).toBe("trial_expirado");
    expect(closed.account.uid).toBe("u1");
  });

  it("recusa estender o trial de uma conta anterior", () => {
    const legacy = { ...emptyAccount("old", "old@example.com"), ...buildLegacyAccount(new Date(NOW).toISOString()), role: "psicologo" as const };
    expect(() => applyAdminAction(legacy, "estender_trial", { days: 30, now: NOW })).toThrow();
  });

  it("suspende e reativa sem mudar a assinatura", () => {
    const suspended = applyAdminAction(trialAccount(), "suspender", { now: NOW });
    expect(suspended.account.accountStatus).toBe("suspensa");
    expect(suspended.account.subscriptionStatus).toBe("trial_ativo");
    const back = applyAdminAction(suspended.account, "reativar", { now: NOW });
    expect(back.account.accountStatus).toBe("ativa");
  });

  it("concede cortesia como acesso administrativo, não como pagamento", () => {
    const granted = applyAdminAction(trialAccount(), "conceder_cortesia", { planId: "consultorio", now: NOW });
    expect(granted.account.subscriptionStatus).toBe("cortesia");
    expect(granted.summary.toLowerCase()).toContain("não é uma assinatura paga");
    expect(resolveAccess(granted.account, NOW).mode).toBe("full");
  });
});

describe("indicadores", () => {
  const plans: PlanDefinition[] = [
    { id: "consultorio", nome: "Consultório", descricao: "", precoCentavos: null, moeda: "BRL", periodicidade: "mensal", trialDias: 0, recursos: [], limiteProfissionais: null, disponivel: true, ordem: 1 },
  ];

  it("não transforma preço ausente nem cortesia em receita", () => {
    const paid = trialAccount({ uid: "p", subscriptionStatus: "ativa", billingAccess: "integral", planId: "consultorio" });
    const gift = trialAccount({ uid: "g", subscriptionStatus: "cortesia", billingAccess: "integral", planId: "consultorio" });
    const metrics = summarizeAccounts([trialAccount(), paid, gift], plans, NOW, null);
    expect(metrics.contratadoCentavos).toBe(0);
    expect(metrics.recebidoCentavos).toBe(0);
    expect(metrics.ativasSemPreco).toBe(1);
    expect(metrics.cortesias).toBe(1);
    expect(metrics.conversoesConfirmadas).toBe(1);
  });

  it("filtra pagantes apenas quando o estado é assinatura ativa", () => {
    const openCheckout = trialAccount({ checkoutStatus: "aguardando_provedor" });
    expect(matchesAccountFilter(openCheckout, "pagantes", NOW)).toBe(false);
    expect(matchesAccountFilter(openCheckout, "pagamento", NOW)).toBe(true);
  });
});
