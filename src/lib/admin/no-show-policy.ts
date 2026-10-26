import type { Appointment, ClinicMember } from "./types";

export type PoliticaFalta = {
  horas: number;
  percentual: number;
};

export const DEFAULT_POLITICA_FALTA: PoliticaFalta = { horas: 24, percentual: 100 };

export function normalizePoliticaFalta(raw: unknown): PoliticaFalta {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const horas = Number(data.horas);
  const percentual = Number(data.percentual);
  const horasNorm = Number.isFinite(horas) ? Math.round(horas) : DEFAULT_POLITICA_FALTA.horas;
  return {
    horas: horasNorm >= 0 && horasNorm <= 168 ? horasNorm : horasNorm > 168 ? 168 : DEFAULT_POLITICA_FALTA.horas,
    percentual:
      Number.isFinite(percentual) && percentual >= 0 && percentual <= 100
        ? Math.round(percentual)
        : DEFAULT_POLITICA_FALTA.percentual,
  };
}

export function formatPoliticaFalta(policy: PoliticaFalta) {
  if (policy.percentual <= 0) {
    return "Faltas sem aviso prévio não geram cobrança automática neste consultório.";
  }
  const horas = policy.horas > 0 ? `${policy.horas} horas` : "o prazo combinado";
  const pct = policy.percentual === 100 ? "integralmente" : `em ${policy.percentual}% do valor da sessão`;
  return `Em caso de falta sem aviso com antecedência mínima de ${horas}, o valor da sessão poderá ser cobrado ${pct}, conforme combinado entre as partes.`;
}

export function computeNoShowCharge(appointment: Appointment, member: ClinicMember) {
  const policy = normalizePoliticaFalta(member.politicaFalta);
  if (policy.percentual <= 0) return null;
  const base =
    appointment.valorSocial && member.valorSocial > 0
      ? member.valorSocial
      : appointment.valor > 0
        ? appointment.valor
        : member.valorBase;
  if (base <= 0) return null;
  const valor = Math.round((base * policy.percentual) / 100);
  if (valor <= 0) return null;
  return { valor, policy, base };
}
