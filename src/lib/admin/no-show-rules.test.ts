import { describe, expect, it } from "vitest";
import {
  DEFAULT_NO_SHOW_RULES,
  countJustifiedAbsences,
  effectiveNoShowRules,
  evaluateNoShow,
  normalizeNoShowRules,
  summarizeNoShowRules,
  type NoShowRules,
} from "./no-show-rules";

const appt = { id: "a3", patientId: "p1", professionalId: "m1", date: "2026-11-10", valor: 200, valorSocial: false };
const member = { valorBase: 250, valorSocial: 80, politicaFalta: { horas: 24, percentual: 50 } };

function absence(id: string, date: string, justificada: boolean | null, extra: Partial<{ patientId: string; professionalId: string | null; status: "faltou" | "concluido" }> = {}) {
  return {
    id,
    patientId: extra.patientId ?? "p1",
    professionalId: extra.professionalId === undefined ? "m1" : extra.professionalId,
    date,
    status: extra.status ?? ("faltou" as const),
    faltaJustificada: justificada,
  };
}

const rules: NoShowRules = {
  automatico: true,
  semJustificativa: { cobrar: true, tipo: "percentual", valor: 100 },
  comJustificativa: { cobrar: false, tipo: "percentual", valor: 0 },
  limiteJustificadas: { ativo: true, quantidade: 2, periodoDias: 90, cobranca: { cobrar: true, tipo: "fixo", valor: 120 } },
};

describe("no-show rules", () => {
  it("keeps legacy members on the old policy as a manual suggestion", () => {
    const { legado, rules: effective } = effectiveNoShowRules(member);
    expect(legado).toBe(true);
    expect(effective.automatico).toBe(false);
    const decision = evaluateNoShow({ appointment: appt, justificada: true, member, history: [] });
    expect(decision.codigo).toBe("politica_legada");
    expect(decision.valor).toBe(100);
    expect(decision.automatico).toBe(false);
  });

  it("charges unjustified absences by percentage of the session", () => {
    const decision = evaluateNoShow({ appointment: appt, justificada: false, member: { ...member, regrasFalta: rules }, history: [] });
    expect(decision).toMatchObject({ codigo: "sem_justificativa", cobrar: true, valor: 200, automatico: true });
  });

  it("does not charge justified absences under the limit", () => {
    const history = [absence("a1", "2026-09-20", true)];
    const decision = evaluateNoShow({ appointment: appt, justificada: true, member: { ...member, regrasFalta: rules }, history });
    expect(decision).toMatchObject({ codigo: "justificada", cobrar: false, valor: 0, justificadasNoPeriodo: 1 });
  });

  it("charges the fixed value once the justified-absence limit is reached in the period", () => {
    const history = [
      absence("a1", "2026-09-20", true),
      absence("a2", "2026-10-15", true),
      absence("x", "2026-10-01", true, { patientId: "p2" }),
      absence("y", "2026-10-02", true, { professionalId: "m2" }),
      absence("z", "2026-10-03", false),
      absence("old", "2026-05-01", true),
    ];
    const decision = evaluateNoShow({ appointment: appt, justificada: true, member: { ...member, regrasFalta: rules }, history });
    expect(decision).toMatchObject({ codigo: "justificada_acima_limite", cobrar: true, valor: 120, justificadasNoPeriodo: 2 });
    expect(decision.descricao).toContain("3ª em 90 dias");
  });

  it("uses the social value when the session is social", () => {
    const decision = evaluateNoShow({
      appointment: { ...appt, valorSocial: true },
      justificada: false,
      member: { ...member, regrasFalta: { ...rules, semJustificativa: { cobrar: true, tipo: "percentual", valor: 50 } } },
      history: [],
    });
    expect(decision.valor).toBe(40);
  });

  it("counts only past justified absences inside the window", () => {
    expect(countJustifiedAbsences(appt, [absence("f", "2026-12-01", true), absence("a3", "2026-11-10", true)], 90)).toBe(0);
  });

  it("normalizes invalid input", () => {
    const normalized = normalizeNoShowRules({
      semJustificativa: { cobrar: true, tipo: "percentual", valor: 500 },
      limiteJustificadas: { ativo: true, quantidade: 0, periodoDias: 9999 },
    });
    expect(normalized.semJustificativa.valor).toBe(100);
    expect(normalized.limiteJustificadas.quantidade).toBe(1);
    expect(normalized.limiteJustificadas.periodoDias).toBe(365);
    expect(normalizeNoShowRules(undefined)).toEqual(DEFAULT_NO_SHOW_RULES);
  });

  it("summarizes rules in pt-BR", () => {
    expect(summarizeNoShowRules(rules)).toContain("A partir da 3ª falta justificada em 90 dias");
  });
});
