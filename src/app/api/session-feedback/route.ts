import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_TO,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const to = typeof body.to === "string" ? body.to.trim().toLowerCase() : "";
    const nome = typeof body.nome === "string" ? body.nome.trim() : "";
    const professional = typeof body.professional === "string" ? body.professional.trim() : "";
    const link = typeof body.link === "string" ? body.link.trim() : "";
    const origin = new URL(req.url).origin;
    if (!to || !professional || !link.startsWith(`${origin}/feedback/`)) {
      return NextResponse.json({ error: "Dados do feedback incompletos" }, { status: 400 });
    }
    if (!process.env.EMAIL_TO || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({ error: "Envio de e-mail não configurado" }, { status: 500 });
    }
    await transporter.sendMail({
      from: '"Psy Manager" <ellensmpsi@gmail.com>',
      to,
      subject: "Como foi o seu atendimento?",
      html: `
        <p>Olá${nome ? ` ${escapeHtml(nome)}` : ""},</p>
        <p>${escapeHtml(professional)} gostaria de saber como foi o atendimento. A avaliação leva um instante: de 1 a 5 estrelas e, se quiser, um comentário.</p>
        <p>O link vale por 48 horas e pode ser respondido uma única vez.</p>
        <p><a href="${escapeHtml(link)}">Avaliar o atendimento</a></p>
      `,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao enviar feedback:", error);
    return NextResponse.json({ error: "Erro ao enviar e-mail" }, { status: 500 });
  }
}
