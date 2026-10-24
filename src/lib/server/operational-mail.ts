import nodemailer from "nodemailer";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

export function operationalMailer() {
  if (!process.env.EMAIL_TO || !process.env.GMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_TO, pass: process.env.GMAIL_APP_PASSWORD },
  });
}

export async function sendOperationalEmail(input: { to: string; subject: string; text: string }) {
  const transport = operationalMailer();
  if (!transport) return { delivered: false as const, reason: "provedor_nao_configurado" };
  const to = input.to.trim().toLowerCase();
  if (!to || !input.subject.trim() || !input.text.trim()) {
    return { delivered: false as const, reason: "mensagem_invalida" };
  }
  try {
    await transport.sendMail({
      from: `"Psy Manager" <${process.env.EMAIL_TO}>`,
      to,
      subject: input.subject.trim().slice(0, 140),
      text: input.text.trim().slice(0, 4000),
      html: `<p>${escapeHtml(input.text).replaceAll("\n", "<br>")}</p>`,
    });
    return { delivered: true as const, reason: "enviado" };
  } catch {
    console.error("Falha no envio operacional");
    return { delivered: false as const, reason: "falha_provedor" };
  }
}
