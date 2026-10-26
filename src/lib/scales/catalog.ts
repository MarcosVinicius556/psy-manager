import type { FormFieldDef, FormTemplate } from "@/lib/admin/form-types";
import { GAD7_QUESTIONS } from "./gad7";
import { PHQ9_QUESTIONS } from "./phq9";

const SCALE_OPTIONS = [
  { value: "0", label: "Nenhum dia" },
  { value: "1", label: "Vários dias" },
  { value: "2", label: "Mais da metade dos dias" },
  { value: "3", label: "Quase todos os dias" },
];

function likertFields(prefix: string, questions: readonly string[]): FormFieldDef[] {
  return questions.map((label, index) => ({
    id: `${prefix}${index + 1}`,
    label: `${index + 1}. ${label}`,
    type: "select",
    required: true,
    options: SCALE_OPTIONS.map((o) => o.value),
    helpText: "0 = Nenhum dia · 1 = Vários dias · 2 = Mais da metade dos dias · 3 = Quase todos os dias",
  }));
}

const now = "2026-01-01T00:00:00.000Z";

export const SCALE_TEMPLATE_IDS = ["scale-phq9", "scale-gad7"] as const;
export type ScaleTemplateId = (typeof SCALE_TEMPLATE_IDS)[number];

export const SCALE_FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "scale-phq9",
    nome: "PHQ-9 (humor)",
    descricao: "Questionário de saúde do paciente — versão de 9 itens.",
    versao: 1,
    finalidade:
      "Acompanhar sintomas de humor nas últimas duas semanas. Resultado é apoio clínico, não diagnóstico. Instrumento de uso livre (Pfizer). Confirme regras SATEPSI/CFP antes de uso formal.",
    campos: likertFields("q", PHQ9_QUESTIONS),
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "scale-gad7",
    nome: "GAD-7 (ansiedade)",
    descricao: "Escala de transtorno de ansiedade generalizada — 7 itens.",
    versao: 1,
    finalidade:
      "Acompanhar sintomas de ansiedade nas últimas duas semanas. Resultado é apoio clínico, não diagnóstico. Instrumento de uso livre. Confirme regras SATEPSI/CFP antes de uso formal.",
    campos: likertFields("q", GAD7_QUESTIONS),
    createdAt: now,
    updatedAt: now,
  },
];

export function findScaleTemplate(id: string) {
  return SCALE_FORM_TEMPLATES.find((item) => item.id === id) ?? null;
}

export function isScaleTemplateId(id: string): id is ScaleTemplateId {
  return SCALE_TEMPLATE_IDS.includes(id as ScaleTemplateId);
}

export const SATEPSI_CFP_NOTE =
  "PHQ-9 e GAD-7 são de uso livre com as licenças publicadas pelos autores. Antes de ampliar o catálogo, confira o SATEPSI/CFP e a Resolução CFP aplicável ao seu contexto.";
