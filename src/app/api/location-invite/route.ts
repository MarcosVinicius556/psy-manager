import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { locationInviteSendableByUid } from "@/lib/server/clinic-access";
import { enforceEmailRateLimit } from "@/lib/server/email-rate-limit";
import { requireAuthUser } from "@/lib/server/require-auth";

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
    const auth = await requireAuthUser(req);
    if ("error" in auth) return auth.error;
    if (!getAdminDb()) {
      return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
    }

    const limited = await enforceEmailRateLimit(auth.uid);
    if (limited) return limited;

    const body = await req.json();
    const inviteId = typeof body.inviteId === "string" ? body.inviteId.trim() : "";
    if (!inviteId) {
      return NextResponse.json({ error: "Dados do convite incompletos" }, { status: 400 });
    }

    const invite = await locationInviteSendableByUid(inviteId, auth.uid);
    if (!invite || !invite.inviteeEmail || !invite.locationNome || !invite.inviterNome) {
      return NextResponse.json({ error: "Convite inválido ou sem permissão." }, { status: 403 });
    }

    if (!process.env.EMAIL_TO || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({ error: "Envio de e-mail não configurado" }, { status: 500 });
    }

    const link = `${new URL(req.url).origin}/admin/notificacoes`;
    await transporter.sendMail({
      from: '"Psy Manager" <ellensmpsi@gmail.com>',
      to: invite.inviteeEmail,
      subject: `Convite para compartilhar ${invite.locationNome}`,
      html: `
        <p>Olá${invite.inviteeNome ? ` ${escapeHtml(invite.inviteeNome)}` : ""},</p>
        <p>${escapeHtml(invite.inviterNome)} convidou você para compartilhar o local <strong>${escapeHtml(invite.locationNome)}</strong>, com a agenda e as despesas desse consultório.</p>
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
