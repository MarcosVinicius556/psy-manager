import { contractFieldValues, fillContractTemplate } from "@/lib/admin/contract";
import { fillTcleTemplate, tcleFieldValues, TCLE_TEMPLATE } from "@/lib/admin/tcle";
import { labelModality } from "@/lib/admin/format";
import type { ClinicMember, Modality, Patient } from "@/lib/admin/types";
import type { SignatureDocKind } from "./signature-requests";

const CONSENT_GRAVACAO = `CONSENTIMENTO PARA GRAVAÇÃO DE SESSÃO

Autorizo a gravação de áudio e/ou vídeo da sessão de psicoterapia exclusivamente para fins de registro clínico e supervisão, sob sigilo profissional. Posso revogar este consentimento a qualquer momento, sem prejuízo do atendimento, mediante comunicação à psicóloga responsável.

Paciente: {{NOME_PACIENTE}}
Profissional: {{NOME_PSICOLOGO}}
Data: {{DATA_HOJE}}`;

const CONSENT_IMAGEM = `CONSENTIMENTO PARA USO DE IMAGEM

Autorizo o uso da minha imagem captada durante o atendimento apenas para fins clínicos e documentação interna, sem divulgação pública, conforme LGPD e código de ética profissional.

Paciente: {{NOME_PACIENTE}}
Profissional: {{NOME_PSICOLOGO}}
Data: {{DATA_HOJE}}`;

function fillSimple(template: string, patient: Patient, professional: Pick<ClinicMember, "nome"> | null) {
  const today = new Date().toISOString().slice(0, 10);
  return template
    .replace(/\{\{NOME_PACIENTE\}\}/g, patient.nome || "—")
    .replace(/\{\{NOME_PSICOLOGO\}\}/g, professional?.nome || "—")
    .replace(/\{\{DATA_HOJE\}\}/g, today);
}

export function buildSignatureDocument(input: {
  kind: SignatureDocKind;
  patient: Patient;
  professional: ClinicMember | null;
  contractMarkdown?: string;
  modality?: Modality;
}) {
  const modality = input.modality ?? "presencial";
  if (input.kind === "tcle") {
    const values = tcleFieldValues({
      patient: input.patient,
      professional: input.professional,
      modalityLabel: labelModality(modality),
    });
    const body = fillTcleTemplate(TCLE_TEMPLATE, values);
    return { body, templateVersion: "tcle-v1" };
  }
  if (input.kind === "contrato") {
    const markdown = input.contractMarkdown?.trim() || "";
    const prof = input.professional
      ? {
          nome: input.professional.nome,
          telefone: input.professional.telefone,
          email: input.professional.email,
          valorBase: input.professional.valorBase,
          valorSocial: input.professional.valorSocial,
        }
      : null;
    const body = fillContractTemplate(markdown, contractFieldValues(input.patient, prof));
    return { body, templateVersion: `contrato-${Date.now()}` };
  }
  if (input.kind === "consentimento_gravacao") {
    return {
      body: fillSimple(CONSENT_GRAVACAO, input.patient, input.professional),
      templateVersion: "gravacao-v1",
    };
  }
  return {
    body: fillSimple(CONSENT_IMAGEM, input.patient, input.professional),
    templateVersion: "imagem-v1",
  };
}
