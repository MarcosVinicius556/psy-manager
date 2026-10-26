import type { FormTemplate } from "./form-types";

const now = "2026-01-01T00:00:00.000Z";

export const BUILTIN_FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "anamnese-tcc",
    nome: "Anamnese TCC",
    descricao: "Ficha inicial com foco em pensamentos, comportamentos e metas.",
    versao: 1,
    finalidade:
      "Coletar histórico clínico inicial para planejamento do tratamento. Os dados são tratados como prontuário, conforme LGPD.",
    campos: [
      { id: "queixa", label: "Queixa principal", type: "textarea", required: true },
      { id: "inicio", label: "Quando os sintomas começaram?", type: "text" },
      { id: "gatilhos", label: "Situações que pioram ou melhoram", type: "textarea" },
      { id: "pensamentos", label: "Pensamentos frequentes", type: "textarea" },
      { id: "comportamentos", label: "Comportamentos que tenta evitar ou repete", type: "textarea" },
      { id: "metas", label: "O que espera alcançar na terapia?", type: "textarea", required: true },
      { id: "medicacao", label: "Medicações em uso", type: "text" },
      { id: "tratamento_anterior", label: "Tratamentos psicológicos ou psiquiátricos anteriores", type: "textarea" },
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "anamnese-psicanalise",
    nome: "Anamnese psicanalítica",
    descricao: "História de vida, vínculos e demanda em linguagem livre.",
    versao: 1,
    finalidade: "Registrar história e contexto para acompanhamento psicanalítico.",
    campos: [
      { id: "demanda", label: "O que te trouxe à terapia?", type: "textarea", required: true },
      { id: "infancia", label: "Recordações relevantes da infância", type: "textarea" },
      { id: "familia", label: "Dinâmica familiar atual", type: "textarea" },
      { id: "relacoes", label: "Relacionamentos significativos", type: "textarea" },
      { id: "sonhos", label: "Sonhos ou fantasias que deseja compartilhar", type: "textarea" },
      { id: "saude", label: "Saúde física e emocional", type: "textarea" },
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "triagem-cadastro",
    nome: "Triagem e cadastro",
    descricao: "Dados administrativos e contato de emergência.",
    versao: 1,
    finalidade: "Atualizar cadastro e contato de emergência antes da primeira sessão.",
    campos: [
      { id: "telefone", label: "Telefone para contato", type: "text", required: true },
      { id: "email", label: "E-mail", type: "text" },
      { id: "endereco", label: "Endereço (cidade/bairro)", type: "text" },
      { id: "emergencia_nome", label: "Contato de emergência — nome", type: "text", required: true },
      { id: "emergencia_tel", label: "Contato de emergência — telefone", type: "text", required: true },
      { id: "preferencia_horario", label: "Preferência de horário", type: "select", options: ["Manhã", "Tarde", "Noite", "Flexível"] },
      { id: "modalidade", label: "Modalidade preferida", type: "select", options: ["Presencial", "Online", "Indiferente"] },
    ],
    createdAt: now,
    updatedAt: now,
  },
];

export function findBuiltinFormTemplate(id: string) {
  return BUILTIN_FORM_TEMPLATES.find((item) => item.id === id) ?? null;
}
