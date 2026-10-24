import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/server/require-auth";
import { operationalMailer, sendOperationalEmail } from "@/lib/server/operational-mail";

export const runtime = "nodejs";

async function readRole(projectId: string, uid: string, idToken: string) {
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!response.ok) return "";
  const data = (await response.json()) as { fields?: { role?: { stringValue?: string } } };
  return data.fields?.role?.stringValue || "";
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthUser(request);
    if ("error" in auth) return auth.error;
    const identity = { uid: auth.uid, email: auth.email };
    const idToken = auth.idToken;

    const body = (await request.json()) as {
      kind?: string;
      to?: string;
      accountUid?: string;
      subject?: string;
      text?: string;
      categoria?: string;
      recipients?: { to?: string; accountUid?: string }[];
    };
    const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 140) : "";
    const text = typeof body.text === "string" ? body.text.trim().slice(0, 4000) : "";
    if (!subject || !text) return NextResponse.json({ delivered: false, reason: "mensagem_invalida" }, { status: 400 });

    if (body.kind === "admin") {
      const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
      if (!projectId) return NextResponse.json({ delivered: false, reason: "firebase_incompleto" }, { status: 500 });
      const role = await readRole(projectId, identity.uid, idToken);
      if (role !== "super_admin") return NextResponse.json({ delivered: false, reason: "sem_permissao" }, { status: 403 });
      const recipients = Array.isArray(body.recipients) ? body.recipients.slice(0, 20) : [];
      const transport = operationalMailer();
      const results = [];
      for (const recipient of recipients) {
        const to = typeof recipient.to === "string" ? recipient.to.trim().toLowerCase() : "";
        if (!to) {
          results.push({ to, delivered: false, reason: "destino_invalido" });
          continue;
        }
        if (!transport) {
          results.push({ to, delivered: false, reason: "provedor_nao_configurado" });
          continue;
        }
        try {
          await transport.sendMail({
            from: `"Psy Manager" <${process.env.EMAIL_TO}>`,
            to,
            subject,
            text,
            html: `<p>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replaceAll("\n", "<br>")}</p>`,
          });
          results.push({ to, delivered: true, reason: "enviado" });
        } catch {
          console.error("Falha ao enviar comunicado administrativo");
          results.push({ to, delivered: false, reason: "falha_provedor" });
        }
      }
      return NextResponse.json({ results });
    }

    const to = typeof body.to === "string" ? body.to.trim().toLowerCase() : "";
    if (!to || to !== identity.email || body.accountUid !== identity.uid) {
      return NextResponse.json({ delivered: false, reason: "destino_nao_autorizado" }, { status: 403 });
    }
    const allowed = new Set(["boas_vindas", "trial_7", "trial_3", "trial_1", "trial_expirado"]);
    if (!body.kind || !allowed.has(body.kind)) return NextResponse.json({ delivered: false, reason: "tipo_nao_permitido" }, { status: 400 });
    const delivery = await sendOperationalEmail({ to, subject, text });
    return NextResponse.json({ delivered: delivery.delivered, reason: delivery.reason });
  } catch (error) {
    console.error("Falha no envio operacional");
    return NextResponse.json({ delivered: false, reason: "falha_envio" }, { status: 500 });
  }
}
