import { NextResponse } from "next/server";
import { paymentOwnedByUid, patientOwnedByUid } from "@/lib/server/clinic-access";
import { enforceEmailRateLimit } from "@/lib/server/email-rate-limit";
import { requireAuthUser } from "@/lib/server/require-auth";
import { sendProfessionalEmail, userEmailConnected } from "@/lib/email-integration/send-service";
import type { OutboundAttachment, TemplateRenderContext } from "@/lib/email-integration/types";
import { isValidRecipientEmail } from "@/lib/email-integration/validate-email";

export const runtime = "nodejs";

function parseAttachments(value: unknown): OutboundAttachment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const filename = typeof (item as { filename?: string }).filename === "string" ? (item as { filename: string }).filename : "";
      const contentType =
        typeof (item as { contentType?: string }).contentType === "string"
          ? (item as { contentType: string }).contentType
          : "application/pdf";
      const contentBase64 =
        typeof (item as { contentBase64?: string }).contentBase64 === "string"
          ? (item as { contentBase64: string }).contentBase64
          : "";
      if (!filename || !contentBase64) return null;
      return { filename, contentType, contentBase64 };
    })
    .filter((item): item is OutboundAttachment => Boolean(item))
    .slice(0, 5);
}

export async function POST(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;

  const limited = await enforceEmailRateLimit(auth.uid);
  if (limited) return limited;

  if (!(await userEmailConnected(auth.uid))) {
    return NextResponse.json({ reason: "email_nao_configurado" }, { status: 403 });
  }

  const body = (await request.json()) as {
    to?: string;
    subject?: string;
    corpo?: string;
    context?: TemplateRenderContext;
    attachments?: unknown;
    templateId?: string;
    templateNome?: string;
    patientId?: string;
    paymentId?: string;
    relatedType?: string;
    relatedId?: string;
  };

  const to = typeof body.to === "string" ? body.to.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject : "";
  const corpo = typeof body.corpo === "string" ? body.corpo : "";
  if (!to || !isValidRecipientEmail(to) || !subject || !corpo) {
    return NextResponse.json({ reason: "dados_invalidos" }, { status: 400 });
  }

  const patientId = typeof body.patientId === "string" ? body.patientId : "";
  if (patientId && !(await patientOwnedByUid(patientId, auth.uid))) {
    return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  }
  const paymentId = typeof body.paymentId === "string" ? body.paymentId : "";
  if (paymentId && !(await paymentOwnedByUid(paymentId, auth.uid))) {
    return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  }

  try {
    await sendProfessionalEmail({
      ownerUid: auth.uid,
      to,
      subjectTemplate: subject,
      bodyTemplate: corpo,
      context: body.context && typeof body.context === "object" ? body.context : {},
      attachments: parseAttachments(body.attachments),
      templateId: body.templateId || null,
      templateNome: body.templateNome || null,
      patientId: patientId || null,
      paymentId: paymentId || null,
      relatedType: body.relatedType || null,
      relatedId: body.relatedId || null,
    });
    return NextResponse.json({ sent: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "falha_envio";
    return NextResponse.json({ sent: false, reason: message }, { status: 502 });
  }
}
