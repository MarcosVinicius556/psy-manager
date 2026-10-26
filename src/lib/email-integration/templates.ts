import type { EmailTemplateTrigger, TemplateRenderContext } from "./types";

export const EMAIL_TEMPLATE_VARIABLES: { key: string; label: string }[] = [
  { key: "paciente_nome", label: "Nome do paciente" },
  { key: "profissional_nome", label: "Nome do profissional" },
  { key: "clinica_nome", label: "Nome da clínica" },
  { key: "data_sessao", label: "Data da sessão" },
  { key: "hora_sessao", label: "Hora da sessão" },
  { key: "valor", label: "Valor" },
  { key: "data_pagamento", label: "Data do pagamento" },
  { key: "descricao", label: "Descrição" },
  { key: "link_avaliacao", label: "Link de avaliação" },
  { key: "pix_copia_cola", label: "Pix copia e cola" },
  { key: "vencimento", label: "Vencimento da cobrança" },
  { key: "link_confirmar", label: "Link de confirmação da sessão" },
  { key: "link_remarcar", label: "Link para remarcar sessão" },
  { key: "link_descadastro", label: "Link para descadastro de lembretes" },
  { key: "local_sessao", label: "Local ou link da sessão" },
];

const VARIABLE_PATTERN = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;

export function renderTemplateText(template: string, context: TemplateRenderContext) {
  return template.replace(VARIABLE_PATTERN, (_, key: string) => {
    const normalized = key.toLowerCase() as keyof TemplateRenderContext;
    const value = context[normalized];
    return value != null && String(value).trim() ? String(value) : "";
  });
}

export function plainTextFromHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function markdownToHtml(body: string) {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const withBreaks = escaped.replace(/\n/g, "<br>");
  const withBold = withBreaks.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#1a2e1f">${withBold}</div>`;
}

export type DefaultTemplateSeed = {
  nome: string;
  trigger: EmailTemplateTrigger;
  assunto: string;
  corpo: string;
  anexo: "nenhum" | "contrato" | "recibo";
};

export const DEFAULT_EMAIL_TEMPLATES: DefaultTemplateSeed[] = [
  {
    nome: "Confirmação de pagamento",
    trigger: "confirmacao_pagamento",
    assunto: "Pagamento confirmado — {{descricao}}",
    corpo: `Olá, {{paciente_nome}}.

Confirmamos o recebimento de **{{valor}}** referente a {{descricao}}, em {{data_pagamento}}.

Atenciosamente,
{{profissional_nome}}
{{clinica_nome}}`,
    anexo: "nenhum",
  },
  {
    nome: "Cópia do contrato",
    trigger: "copia_contrato",
    assunto: "Contrato de atendimento — {{clinica_nome}}",
    corpo: `Olá, {{paciente_nome}}.

Em anexo está a cópia do contrato de prestação de serviços psicológicos.

{{profissional_nome}}
{{clinica_nome}}`,
    anexo: "contrato",
  },
  {
    nome: "Envio de recibo",
    trigger: "envio_recibo",
    assunto: "Recibo — {{descricao}}",
    corpo: `Olá, {{paciente_nome}}.

Segue em anexo o recibo referente a {{descricao}} ({{valor}}), pago em {{data_pagamento}}.

{{profissional_nome}}`,
    anexo: "recibo",
  },
  {
    nome: "Lembrete de sessão",
    trigger: "lembrete_sessao",
    assunto: "Lembrete: sessão em {{data_sessao}} às {{hora_sessao}}",
    corpo: `Olá, {{paciente_nome}}.

Lembramos da sua sessão agendada para **{{data_sessao}}** às **{{hora_sessao}}**.

{{local_sessao}}

Confirme em um clique: {{link_confirmar}}

Precisa remarcar? Abra o mesmo link e escolha a opção de remarcação.

Para não receber lembretes por e-mail: {{link_descadastro}}

{{profissional_nome}}
{{clinica_nome}}`,
    anexo: "nenhum",
  },
  {
    nome: "Confirmação de agendamento",
    trigger: "confirmacao_agendamento",
    assunto: "Sessão confirmada — {{data_sessao}} às {{hora_sessao}}",
    corpo: `Olá, {{paciente_nome}}.

Sua sessão com {{profissional_nome}} foi confirmada para **{{data_sessao}}** às **{{hora_sessao}}**.

{{local_sessao}}

Atenciosamente,
{{profissional_nome}}
{{clinica_nome}}`,
    anexo: "nenhum",
  },
  {
    nome: "Cobrança com Pix",
    trigger: "cobranca_pix",
    assunto: "Cobrança — {{descricao}} (vence {{vencimento}})",
    corpo: `Olá, {{paciente_nome}}.

Segue o Pix no valor de **{{valor}}** referente a {{descricao}}, com vencimento em {{vencimento}}.

Pix copia e cola:
{{pix_copia_cola}}

Após pagar, envie o comprovante pelo canal combinado. O recebimento é confirmado manualmente pelo profissional.

{{profissional_nome}}
{{clinica_nome}}`,
    anexo: "nenhum",
  },
  {
    nome: "Link de avaliação",
    trigger: "link_avaliacao",
    assunto: "Como foi o atendimento?",
    corpo: `Olá, {{paciente_nome}}.

Gostaríamos de saber como foi sua experiência. A avaliação é rápida:

{{link_avaliacao}}

Obrigado,
{{profissional_nome}}`,
    anexo: "nenhum",
  },
];
