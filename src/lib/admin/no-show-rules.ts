import { normalizePoliticaFalta } from "./no-show-policy";
import type { Appointment, ClinicMember } from "./types";

/**
 * Regras de cobrança por falta configuradas por cada psicóloga(o) em
 * Configurações > Valores da consulta. Ficam em `members/{id}.regrasFalta`.
 *
 * Compatibilidade: quem nunca salvou as regras novas continua com a política
 * antiga (`politicaFalta`: aviso mínimo + percentual), aplicada como sugestão
 * manual, exatamente como antes.
 */
export type NoShowChargeKind = "percentual" | "fixo";

export type NoShowChargeConfig = {
  cobrar: boolean;
  tipo: NoShowChargeKind;
  /** Percentual (0–100) do valor da sessão ou valor fixo em reais. */
  valor: number;
};

export type NoShowRules = {
  /** Cria (ou deixa de criar) a cobrança automaticamente ao registrar a falta. */
  automatico: boolean;
  semJustificativa: NoShowChargeConfig;
  comJustificativa: NoShowChargeConfig;
  /** Depois de N faltas justificadas no período, as próximas passam a ser cobradas. */
  limiteJustificadas: {
    ativo: boolean;
    quantidade: number;
    periodoDias: number;
    cobranca: NoShowChargeConfig;
  };
};

export type NoShowRuleCode =
  | "sem_justificativa"
  | "justificada"
  | "justificada_acima_limite"
  | "politica_legada"
  | "manual";

export type NoShowDecision = {
  codigo: NoShowRuleCode;
  cobrar: boolean;
  valor: number;
  base: number;
  /** Texto curto mostrado na cobrança e no atendimento. */
  descricao: string;
  /** Quantas faltas justificadas o paciente já tinha no período (sem contar esta). */
  justificadasNoPeriodo: number;
  automatico: boolean;
};

export const NO_SHOW_PERIOD_OPTIONS = [30, 60, 90, 180, 365] as const;

export const DEFAULT_NO_SHOW_RULES: NoShowRules = {
  automatico: true,
  semJustificativa: { cobrar: true, tipo: "percentual", valor: 100 },
  comJustificativa: { cobrar: false, tipo: "percentual", valor: 0 },
  limiteJustificadas: {
    ativo: false,
    quantidade: 2,
    periodoDias: 90,
    cobranca: { cobrar: true, tipo: "percentual", valor: 50 },
  },
};

function num(value: unknown, fallback: number) {
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundCents(value: number) {
  return Math.round(value * 100) / 100;
}

export function normalizeChargeConfig(raw: unknown, fallback: NoShowChargeConfig): NoShowChargeConfig {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const tipo: NoShowChargeKind = data.tipo === "fixo" ? "fixo" : data.tipo === "percentual" ? "percentual" : fallback.tipo;
  const cobrar = typeof data.cobrar === "boolean" ? data.cobrar : fallback.cobrar;
  const valorRaw = num(data.valor, fallback.valor);
  const valor = tipo === "percentual" ? Math.round(clamp(valorRaw, 0, 100)) : roundCents(clamp(valorRaw, 0, 100000));
  return { cobrar, tipo, valor };
}

export function normalizeNoShowRules(raw: unknown): NoShowRules {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const limite = data.limiteJustificadas && typeof data.limiteJustificadas === "object"
    ? (data.limiteJustificadas as Record<string, unknown>)
    : {};
  const d = DEFAULT_NO_SHOW_RULES;
  return {
    automatico: typeof data.automatico === "boolean" ? data.automatico : d.automatico,
    semJustificativa: normalizeChargeConfig(data.semJustificativa, d.semJustificativa),
    comJustificativa: normalizeChargeConfig(data.comJustificativa, d.comJustificativa),
    limiteJustificadas: {
      ativo: typeof limite.ativo === "boolean" ? limite.ativo : d.limiteJustificadas.ativo,
      quantidade: Math.round(clamp(num(limite.quantidade, d.limiteJustificadas.quantidade), 1, 24)),
      periodoDias: Math.round(clamp(num(limite.periodoDias, d.limiteJustificadas.periodoDias), 7, 365)),
      cobranca: normalizeChargeConfig(limite.cobranca, d.limiteJustificadas.cobranca),
    },
  };
}

/** Regras efetivas do profissional: as novas, ou a política antiga convertida (sugestão manual). */
export function effectiveNoShowRules(member: Pick<ClinicMember, "politicaFalta"> & { regrasFalta?: unknown }): {
  rules: NoShowRules;
  legado: boolean;
} {
  if (member.regrasFalta) return { rules: normalizeNoShowRules(member.regrasFalta), legado: false };
  const legacy = normalizePoliticaFalta(member.politicaFalta);
  const charge: NoShowChargeConfig = { cobrar: legacy.percentual > 0, tipo: "percentual", valor: legacy.percentual };
  return {
    legado: true,
    rules: {
      automatico: false,
      semJustificativa: charge,
      // A política antiga não diferenciava justificativa: mantém o mesmo comportamento.
      comJustificativa: charge,
      limiteJustificadas: { ...DEFAULT_NO_SHOW_RULES.limiteJustificadas, ativo: false },
    },
  };
}

export function sessionBaseValue(appointment: Pick<Appointment, "valor" | "valorSocial">, member: Pick<ClinicMember, "valorBase" | "valorSocial">) {
  if (appointment.valorSocial && member.valorSocial > 0) return member.valorSocial;
  if (appointment.valor > 0) return appointment.valor;
  return member.valorBase;
}

export function chargeAmount(config: NoShowChargeConfig, base: number) {
  if (!config.cobrar) return 0;
  if (config.tipo === "fixo") return roundCents(config.valor);
  return roundCents((base * config.valor) / 100);
}

export function describeChargeConfig(config: NoShowChargeConfig) {
  if (!config.cobrar || config.valor <= 0) return "não cobra";
  if (config.tipo === "fixo") {
    return `cobra ${config.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
  }
  return config.valor === 100 ? "cobra a sessão inteira" : `cobra ${config.valor}% da sessão`;
}

function daysBetween(fromIso: string, toIso: string) {
  const a = Date.parse(`${fromIso}T12:00:00Z`);
  const b = Date.parse(`${toIso}T12:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.POSITIVE_INFINITY;
  return Math.round((b - a) / 86_400_000);
}

/**
 * Faltas justificadas do mesmo paciente com o mesmo profissional dentro da
 * janela de `periodoDias` dias antes da data do atendimento (sem contar ele).
 */
export function countJustifiedAbsences(
  appointment: Pick<Appointment, "id" | "patientId" | "professionalId" | "date">,
  history: Pick<Appointment, "id" | "patientId" | "professionalId" | "date" | "status" | "faltaJustificada">[],
  periodoDias: number
) {
  return history.filter((item) => {
    if (item.id === appointment.id) return false;
    if (item.patientId !== appointment.patientId) return false;
    if ((item.professionalId || null) !== (appointment.professionalId || null)) return false;
    if (item.status !== "faltou" || item.faltaJustificada !== true) return false;
    const diff = daysBetween(item.date, appointment.date);
    return diff >= 0 && diff < periodoDias;
  }).length;
}

export function evaluateNoShow(input: {
  appointment: Pick<Appointment, "id" | "patientId" | "professionalId" | "date" | "valor" | "valorSocial">;
  justificada: boolean;
  member: Pick<ClinicMember, "valorBase" | "valorSocial" | "politicaFalta"> & { regrasFalta?: unknown };
  history: Pick<Appointment, "id" | "patientId" | "professionalId" | "date" | "status" | "faltaJustificada">[];
}): NoShowDecision {
  const { rules, legado } = effectiveNoShowRules(input.member);
  const base = sessionBaseValue(input.appointment, input.member);
  const justificadasNoPeriodo = countJustifiedAbsences(input.appointment, input.history, rules.limiteJustificadas.periodoDias);

  if (legado) {
    const valor = chargeAmount(rules.semJustificativa, base);
    return {
      codigo: "politica_legada",
      cobrar: valor > 0,
      valor,
      base,
      descricao:
        valor > 0
          ? `Política de falta (${rules.semJustificativa.valor}% da sessão)`
          : "Política de falta sem cobrança",
      justificadasNoPeriodo,
      automatico: false,
    };
  }

  if (!input.justificada) {
    const valor = chargeAmount(rules.semJustificativa, base);
    return {
      codigo: "sem_justificativa",
      cobrar: valor > 0,
      valor,
      base,
      descricao: `Falta sem justificativa: ${describeChargeConfig(rules.semJustificativa)}`,
      justificadasNoPeriodo,
      automatico: rules.automatico,
    };
  }

  const limite = rules.limiteJustificadas;
  if (limite.ativo && justificadasNoPeriodo >= limite.quantidade) {
    const valor = chargeAmount(limite.cobranca, base);
    return {
      codigo: "justificada_acima_limite",
      cobrar: valor > 0,
      valor,
      base,
      descricao: `Falta justificada acima do limite (${justificadasNoPeriodo + 1}ª em ${limite.periodoDias} dias; tolerância de ${limite.quantidade}): ${describeChargeConfig(limite.cobranca)}`,
      justificadasNoPeriodo,
      automatico: rules.automatico,
    };
  }

  const valor = chargeAmount(rules.comJustificativa, base);
  return {
    codigo: "justificada",
    cobrar: valor > 0,
    valor,
    base,
    descricao: `Falta justificada: ${describeChargeConfig(rules.comJustificativa)}`,
    justificadasNoPeriodo,
    automatico: rules.automatico,
  };
}

/** Texto do resumo das regras (Configurações e contrato). */
export function summarizeNoShowRules(rules: NoShowRules) {
  const parts = [
    `Sem justificativa: ${describeChargeConfig(rules.semJustificativa)}.`,
    `Com justificativa: ${describeChargeConfig(rules.comJustificativa)}.`,
  ];
  if (rules.limiteJustificadas.ativo) {
    parts.push(
      `A partir da ${rules.limiteJustificadas.quantidade + 1}ª falta justificada em ${rules.limiteJustificadas.periodoDias} dias: ${describeChargeConfig(rules.limiteJustificadas.cobranca)}.`
    );
  }
  return parts.join(" ");
}

export const NO_SHOW_RULE_LABELS: Record<NoShowRuleCode, string> = {
  sem_justificativa: "Falta sem justificativa",
  justificada: "Falta justificada",
  justificada_acima_limite: "Falta justificada acima do limite",
  politica_legada: "Política de falta",
  manual: "Ajuste manual",
};
