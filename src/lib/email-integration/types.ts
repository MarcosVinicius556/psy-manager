export type EmailProvider = "gmail_oauth" | "gmail_smtp" | null;

export type EmailIntegrationPublic = {
  provider: EmailProvider;
  connectedAddress: string | null;
  connectedAt: string | null;
  /** At least one connect mode (OAuth or SMTP) is configured on the server. */
  available: boolean;
  oauthAvailable: boolean;
  smtpAvailable: boolean;
};

export type EmailIntegrationPrivate = {
  provider: EmailProvider;
  connectedAddress: string;
  connectedAt: string;
  refreshTokenEncrypted?: string;
  accessTokenEncrypted?: string;
  accessTokenExpiresAt?: number;
  smtpPasswordEncrypted?: string;
  oauthStateNonce?: string;
};

export type EmailTemplateTrigger =
  | "confirmacao_pagamento"
  | "copia_contrato"
  | "envio_recibo"
  | "lembrete_sessao"
  | "confirmacao_agendamento"
  | "link_avaliacao"
  | "livre";

export type EmailAttachmentKind = "nenhum" | "contrato" | "recibo";

export type EmailTemplateVersion = {
  id: string;
  versao: number;
  quando: string;
  resumo: string;
  nome: string;
  assunto: string;
  corpo: string;
};

export type EmailTemplate = {
  id: string;
  nome: string;
  trigger: EmailTemplateTrigger;
  assunto: string;
  corpo: string;
  anexo: EmailAttachmentKind;
  autoSend: boolean;
  arquivado: boolean;
  versao: number;
  historico: EmailTemplateVersion[];
  createdAt: string;
  updatedAt: string;
};

export type EmailLogStatus = "enviado" | "erro" | "pendente";

export type EmailLogEntry = {
  id: string;
  to: string;
  templateId: string | null;
  templateNome: string | null;
  subject: string;
  status: EmailLogStatus;
  error: string | null;
  sentAt: string;
  patientId: string | null;
  paymentId: string | null;
  relatedType: string | null;
  relatedId: string | null;
};

export type TemplateRenderContext = {
  paciente_nome?: string;
  profissional_nome?: string;
  clinica_nome?: string;
  data_sessao?: string;
  hora_sessao?: string;
  valor?: string;
  data_pagamento?: string;
  descricao?: string;
  link_avaliacao?: string;
  link_confirmar?: string;
  link_remarcar?: string;
  link_descadastro?: string;
  local_sessao?: string;
};

export type OutboundAttachment = {
  filename: string;
  contentType: string;
  contentBase64: string;
};
