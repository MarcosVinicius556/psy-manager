import { LEGAL_OWNER } from "@/lib/legal/config";
import { formatCrp } from "./crp";
import { formatDate, todayISO } from "./format";
import { maskCpf } from "../masks";
import type { ClinicMember, Patient } from "./types";

export const TCLE_TEMPLATE = `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE)
Tratamento de dados pessoais e atendimento psicológico

Eu, {{NOME_PACIENTE}}, {{QUALIFICACAO_PACIENTE}}, declaro que fui informado(a) pela psicóloga {{NOME_PSICOLOGO}}, CRP {{CRP}}, sobre:

1. Finalidade: registro e gestão do meu atendimento psicológico, inclusive armazenamento de prontuário na plataforma Psy Manager, operada por {{RAZAO_SOCIAL}} como operadora de dados sob instruções da profissional/clínica controladora.

2. Dados tratados: identificação, contato, histórico de sessões, evolução clínica, documentos anexos e, quando aplicável, dados sensíveis de saúde previstos no art. 11 da LGPD.

3. Forma de atendimento: {{MODALIDADE_ATENDIMENTO}} (presencial e/ou por tecnologias da informação e comunicação — TIC), nos termos da Resolução CFP nº 9/2024.

4. Compartilhamento: dados poderão ser tratados por suboperadores listados em https://www.psymanager.com.br/suboperadores, com possível transferência internacional e salvaguardas contratuais.

5. Direitos: posso solicitar informações, correções ou revogação do consentimento, quando cabível, diretamente à psicóloga responsável ou pelo canal {{CONTATO_CLINICA}}.

6. Sigilo: fui informado(a) sobre o dever de sigilo profissional e as exceções legais.

7. Tempo de guarda: registros serão mantidos pelo prazo mínimo de 5 (cinco) anos ou conforme orientação profissional e legal aplicável.

Declaro que tive oportunidade de tirar dúvidas e consinto com o tratamento descrito.

Local e data: {{LOCAL_DATA}}

Assinatura do paciente ou responsável legal: _______________________________
Nome do responsável legal (se menor): {{RESPONSAVEL_LEGAL}}

Assinatura da psicóloga: _______________________________`;

const EMPTY = "—";

function patientQualification(patient: Patient) {
  const parts: string[] = [];
  if (patient.cpf.trim()) parts.push(`CPF ${maskCpf(patient.cpf)}`);
  if (patient.nascimento.trim()) parts.push(`nascido(a) em ${formatDate(patient.nascimento)}`);
  if (patient.endereco.trim()) parts.push(`residente em ${patient.endereco.trim()}`);
  return parts.length ? parts.join(", ") : EMPTY;
}

export function tcleFieldValues(input: {
  patient: Patient;
  professional: Pick<ClinicMember, "nome" | "email" | "telefone" | "crpNumero" | "crpRegiao"> | null;
  modalityLabel: string;
  contactEmail?: string;
  localData?: string;
  responsavelLegal?: string;
  today?: string;
}) {
  const crp = formatCrp(input.professional?.crpNumero ?? "", input.professional?.crpRegiao ?? "");
  const encarregado = LEGAL_OWNER.ENCARREGADO_EMAIL.trim();
  const contact =
    input.contactEmail?.trim() ||
    input.professional?.email.trim() ||
    (encarregado.startsWith("{{") ? "" : encarregado);
  const razao = LEGAL_OWNER.RAZAO_SOCIAL.includes("{{") ? "Psy Manager" : LEGAL_OWNER.RAZAO_SOCIAL;
  return {
    NOME_PACIENTE: input.patient.nome.trim() || EMPTY,
    QUALIFICACAO_PACIENTE: patientQualification(input.patient),
    NOME_PSICOLOGO: input.professional?.nome.trim() || EMPTY,
    CRP: crp || EMPTY,
    RAZAO_SOCIAL: razao,
    MODALIDADE_ATENDIMENTO: input.modalityLabel.trim() || EMPTY,
    CONTATO_CLINICA: contact || EMPTY,
    LOCAL_DATA: input.localData?.trim() || formatDate(input.today ?? todayISO()),
    RESPONSAVEL_LEGAL: input.responsavelLegal?.trim() || EMPTY,
  };
}

export function fillTcleTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (match, key: string) => {
    const value = values[key];
    if (typeof value !== "string" || !value.trim()) return EMPTY;
    return value.trim();
  });
}

export async function createTclePdf(input: {
  patient: Patient;
  professional: Pick<ClinicMember, "nome" | "email" | "telefone" | "crpNumero" | "crpRegiao"> | null;
  modalityLabel: string;
}) {
  const { jsPDF } = await import("jspdf");
  const values = tcleFieldValues({ ...input, today: todayISO() });
  const text = fillTcleTemplate(TCLE_TEMPLATE, values);
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const margin = 18;
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  let y = 22;
  const bottom = doc.internal.pageSize.getHeight() - 16;
  for (const line of lines) {
    if (y > bottom) {
      doc.addPage();
      y = 22;
    }
    doc.text(line, margin, y);
    y += 5.2;
  }
  const slug = input.patient.nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const buffer = doc.output("arraybuffer");
  return {
    filename: `tcle-${slug || "paciente"}.pdf`,
    bytes: new Uint8Array(buffer),
  };
}

export async function downloadTclePdf(input: {
  patient: Patient;
  professional: Pick<ClinicMember, "nome" | "email" | "telefone" | "crpNumero" | "crpRegiao"> | null;
  modalityLabel: string;
}) {
  if (typeof document === "undefined") throw new Error("O PDF do TCLE é gerado no navegador.");
  const { filename, bytes } = await createTclePdf(input);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
