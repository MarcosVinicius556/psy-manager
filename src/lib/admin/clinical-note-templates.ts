import type { ClinicalApproachId, ClinicalRecord, ClinicalNoteTemplate, ClinicalTemplateSectionDef } from "./types";

export const CLINICAL_APPROACH_LABELS: Record<ClinicalApproachId, string> = {
  tcc: "TCC",
  psicanalise: "Psicanálise",
  humanista: "Humanista / ACP",
  sistemica: "Sistêmica",
  livre: "Livre",
  custom: "Personalizado",
};

const section = (
  key: string,
  label: string,
  mapTo?: ClinicalTemplateSectionDef["mapTo"]
): ClinicalTemplateSectionDef => ({ key, label, mapTo });

export const BUILTIN_CLINICAL_TEMPLATES: ClinicalNoteTemplate[] = [
  {
    id: "builtin:tcc",
    nome: "TCC — sessão",
    approach: "tcc",
    sections: [
      section("evolucao", "Evolução clínica", "clinicalEvolution"),
      section("pensamentos", "Pensamentos e crenças", "aspectosCognitivos"),
      section("emocoes", "Emoções e comportamentos", "aspectosEmocionais"),
      section("intervencoes", "Intervenções e técnicas", "intervencoes"),
      section("objetivos", "Objetivos da sessão", "objetivos"),
    ],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "builtin:psicanalise",
    nome: "Psicanálise — sessão",
    approach: "psicanalise",
    sections: [
      section("evolucao", "Evolução clínica", "clinicalEvolution"),
      section("associacoes", "Associações e conteúdo manifesto", "aspectosCognitivos"),
      section("transferencia", "Transferência e contratransferência", "aspectosEmocionais"),
      section("intervencoes", "Intervenções", "intervencoes"),
      section("evolucao_sessao", "Evolução da sessão", "evolucaoSessao"),
    ],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "builtin:humanista",
    nome: "Humanista / ACP",
    approach: "humanista",
    sections: [
      section("evolucao", "Evolução clínica", "clinicalEvolution"),
      section("experiencia", "Experiência vivida", "aspectosEmocionais"),
      section("recursos", "Recursos e potencialidades", "aspectosCognitivos"),
      section("intervencoes", "Intervenções", "intervencoes"),
      section("objetivos", "Foco da sessão", "objetivos"),
    ],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "builtin:sistemica",
    nome: "Sistêmica",
    approach: "sistemica",
    sections: [
      section("evolucao", "Evolução clínica", "clinicalEvolution"),
      section("sistema", "Dinâmica familiar / sistema", "aspectosCognitivos"),
      section("emocoes", "Emoções e vínculos", "aspectosEmocionais"),
      section("intervencoes", "Intervenções", "intervencoes"),
      section("evolucao_sessao", "Evolução da sessão", "evolucaoSessao"),
    ],
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "builtin:livre",
    nome: "Livre",
    approach: "livre",
    sections: [section("evolucao", "Evolução clínica", "clinicalEvolution"), section("anotacoes", "Anotações", "notes")],
    createdAt: "",
    updatedAt: "",
  },
];

export function isBuiltinClinicalTemplateId(id: string) {
  return id.startsWith("builtin:");
}

export function builtinClinicalTemplate(id: string) {
  return BUILTIN_CLINICAL_TEMPLATES.find((item) => item.id === id) ?? null;
}

export function mergeClinicalTemplates(custom: ClinicalNoteTemplate[]) {
  return [...BUILTIN_CLINICAL_TEMPLATES, ...custom];
}

export function resolveClinicalTemplate(id: string, custom: ClinicalNoteTemplate[]) {
  const builtin = builtinClinicalTemplate(id);
  if (builtin) return builtin;
  return custom.find((item) => item.id === id) ?? null;
}

/** Sincroniza seções do modelo com os campos legados do prontuário. */
export function applySectionsToClinicalRecord(
  clinical: ClinicalRecord,
  template: ClinicalNoteTemplate,
  sections: Record<string, string>
): ClinicalRecord {
  const next: ClinicalRecord = {
    ...clinical,
    approach: template.approach,
    templateId: template.id,
    sections: { ...sections },
  };
  for (const def of template.sections) {
    const value = sections[def.key] ?? "";
    if (def.mapTo) {
      next[def.mapTo] = value;
    }
  }
  return next;
}

export function hydrateSectionsFromClinical(clinical: ClinicalRecord, template: ClinicalNoteTemplate) {
  const sections: Record<string, string> = { ...clinical.sections };
  for (const def of template.sections) {
    if (sections[def.key]?.trim()) continue;
    if (def.mapTo) {
      const legacy = clinical[def.mapTo];
      if (typeof legacy === "string" && legacy.trim()) sections[def.key] = legacy;
    }
  }
  return sections;
}

export function defaultTemplateForApproach(approach: ClinicalApproachId) {
  return BUILTIN_CLINICAL_TEMPLATES.find((item) => item.approach === approach) ?? BUILTIN_CLINICAL_TEMPLATES[0];
}
