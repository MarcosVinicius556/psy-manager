import { buildMimeMessage } from "./mime";
import { sendViaGmailApi } from "./gmail-api";
import { sendViaUserSmtp } from "./smtp-send";
import { markdownToHtml, plainTextFromHtml, renderTemplateText } from "./templates";
import type { OutboundAttachment, TemplateRenderContext } from "./types";
import { readEmailIntegration } from "./store";
import { writeEmailLog } from "./email-log";
import { isValidRecipientEmail, normalizeRecipientEmail } from "./validate-email";

export type SendEmailInput = {
  ownerUid: string;
  to: string;
  subjectTemplate: string;
  bodyTemplate: string;
  context: TemplateRenderContext;
  attachments?: OutboundAttachment[];
  templateId?: string | null;
  templateNome?: string | null;
  patientId?: string | null;
  paymentId?: string | null;
  relatedType?: string | null;
  relatedId?: string | null;
};

export async function userEmailConnected(uid: string) {
  const record = await readEmailIntegration(uid);
  return Boolean(record?.provider && record.connectedAddress);
}

export async function sendProfessionalEmail(input: SendEmailInput) {
  const to = normalizeRecipientEmail(input.to);
  if (!isValidRecipientEmail(to)) throw new Error("destino_invalido");

  const record = await readEmailIntegration(input.ownerUid);
  if (!record?.provider || !record.connectedAddress) throw new Error("email_nao_configurado");

  const subject = renderTemplateText(input.subjectTemplate, input.context).trim().slice(0, 500);
  const bodyRendered = renderTemplateText(input.bodyTemplate, input.context);
  const html = markdownToHtml(bodyRendered);
  const text = plainTextFromHtml(html);
  const from = record.connectedAddress;

  try {
    if (record.provider === "gmail_oauth") {
      const raw = buildMimeMessage({ from, to, subject, html, text, attachments: input.attachments });
      await sendViaGmailApi(input.ownerUid, raw);
    } else if (record.provider === "gmail_smtp") {
      await sendViaUserSmtp(input.ownerUid, { to, subject, html, text, attachments: input.attachments });
    } else {
      throw new Error("provedor_invalido");
    }
    await writeEmailLog({
      ownerUid: input.ownerUid,
      to,
      templateId: input.templateId ?? null,
      templateNome: input.templateNome ?? null,
      subject,
      status: "enviado",
      error: null,
      patientId: input.patientId,
      paymentId: input.paymentId,
      relatedType: input.relatedType,
      relatedId: input.relatedId,
    });
    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "falha_envio";
    await writeEmailLog({
      ownerUid: input.ownerUid,
      to,
      templateId: input.templateId ?? null,
      templateNome: input.templateNome ?? null,
      subject,
      status: "erro",
      error: message,
      patientId: input.patientId,
      paymentId: input.paymentId,
      relatedType: input.relatedType,
      relatedId: input.relatedId,
    });
    throw error;
  }
}
