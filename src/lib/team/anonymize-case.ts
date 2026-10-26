import type { ClinicalRecord, Patient } from "@/lib/admin/types";
import type { SupervisionCasePayload } from "./types";

const CPF_PATTERN = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /\(?\d{2}\)?\s?\d{4,5}-?\d{4}\b/g;

function scrubText(value: string, patient: Patient) {
  let text = value;
  const tokens = [patient.nome, patient.email, patient.telefone, patient.cpf, patient.endereco].filter(Boolean);
  for (const token of tokens) {
    if (token.length < 3) continue;
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(escaped, "gi"), "[redigido]");
  }
  text = text.replace(CPF_PATTERN, "[cpf]");
  text = text.replace(EMAIL_PATTERN, "[e-mail]");
  text = text.replace(PHONE_PATTERN, "[telefone]");
  return text;
}

export function buildAnonymizedCase(input: {
  patient: Patient;
  sessions: { date: string; clinical: ClinicalRecord }[];
  titulo: string;
}): SupervisionCasePayload {
  const sorted = [...input.sessions].sort((a, b) => a.date.localeCompare(b.date));
  const base = sorted[0]?.date || input.sessions[0]?.date || "";
  const linhaDoTempo = sorted.map((session) => {
    const relativo = base ? `D+${daysBetween(base, session.date)}` : session.date;
    const evolution = session.clinical.clinicalEvolution || session.clinical.evolucaoSessao || "";
    const notes = session.clinical.notes || "";
    const merged = [evolution, notes].filter((part) => part.trim()).join("\n\n");
    return {
      relativo,
      texto: scrubText(merged, input.patient),
    };
  });
  return {
    titulo: scrubText(input.titulo.trim() || "Caso anonimizado", input.patient),
    resumo: scrubText(
      linhaDoTempo.map((item) => `${item.relativo}: ${item.texto.slice(0, 180)}`).join("\n"),
      input.patient
    ),
    linhaDoTempo,
    avisos: [
      "Revise o texto antes de compartilhar: campos livres podem conter identificadores.",
      "Recomenda-se consentimento do paciente para uso em supervisão.",
    ],
  };
}

function daysBetween(start: string, end: string) {
  const a = Date.parse(`${start}T12:00:00Z`);
  const b = Date.parse(`${end}T12:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
}
