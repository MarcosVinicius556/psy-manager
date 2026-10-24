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
    const local = typeof body.local === "string" ? body.local.trim() : "";
    const inviter = typeof body.inviter === "string" ? body.inviter.trim() : "";
    if (!to || !local || !inviter) {
      return NextResponse.json({ error: "Dados do convite incompletos" }, { status: 400 });
    }
    if (!process.env.EMAIL_TO || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({ error: "Envio de e-mail não configurado" }, { status: 500 });
    }
    const link = `${new URL(req.url).origin}/admin/notificacoes`;
    await transporter.sendMail({
      from: '"Psy Manager" <ellensmpsi@gmail.com>',
      to,
      subject: `Convite para compartilhar ${local}`,
      html: `
        <p>Olá${nome ? ` ${escapeHtml(nome)}` : ""},</p>
        <p>${escapeHtml(inviter)} convidou você para compartilhar o local <strong>${escapeHtml(local)}</strong>, com a agenda e as despesas desse consultório.</p>
        <p>O vínculo só acontece depois que você aceitar o convite.</p>
        <p><a href="${link}">Abrir notificações e responder o convite</a></p>
      `,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao enviar convite:", error);
    return NextResponse.json({ error: "Erro ao enviar e-mail" }, { status: 500 });
  }
}
