import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/server/require-auth";
import { markdownToHtml, renderTemplateText } from "@/lib/email-integration/templates";
import type { TemplateRenderContext } from "@/lib/email-integration/types";
import { isValidRecipientEmail } from "@/lib/email-integration/validate-email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json()) as {
    subject?: string;
    corpo?: string;
    context?: TemplateRenderContext;
    to?: string;
  };
  const subjectTemplate = typeof body.subject === "string" ? body.subject : "";
  const corpoTemplate = typeof body.corpo === "string" ? body.corpo : "";
  const context = body.context && typeof body.context === "object" ? body.context : {};
  const to = typeof body.to === "string" ? body.to.trim() : "";
  if (!subjectTemplate || !corpoTemplate) {
    return NextResponse.json({ reason: "conteudo_invalido" }, { status: 400 });
  }
  if (to && !isValidRecipientEmail(to)) {
    return NextResponse.json({ reason: "destino_invalido" }, { status: 400 });
  }

  const subject = renderTemplateText(subjectTemplate, context);
  const bodyRendered = renderTemplateText(corpoTemplate, context);
  const html = markdownToHtml(bodyRendered);

  return NextResponse.json({ subject, body: bodyRendered, html, to });
}
