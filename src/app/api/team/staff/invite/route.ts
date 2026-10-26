import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getAdminDb } from "@/lib/firebase-admin";
import { createStaffInvite } from "@/lib/server/staff-service";
import { requireWorkspace } from "@/lib/server/require-workspace";
import { enforceEmailRateLimit } from "@/lib/server/email-rate-limit";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_TO,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(request: Request) {
  const ctx = await requireWorkspace(request);
  if ("error" in ctx) return ctx.error;
  if (ctx.workspace.kind !== "owner") {
    return NextResponse.json({ reason: "proibido" }, { status: 403 });
  }
  const limited = await enforceEmailRateLimit(ctx.auth.uid);
  if (limited) return limited;
  if (!getAdminDb()) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });

  const body = await request.json();
  const inviteeEmail = typeof body.inviteeEmail === "string" ? body.inviteeEmail : "";
  const inviteeNome = typeof body.inviteeNome === "string" ? body.inviteeNome : "";
  const ownerNome = typeof body.ownerNome === "string" ? body.ownerNome : "Profissional";

  const invite = await createStaffInvite({
    ownerUid: ctx.auth.uid,
    ownerNome,
    inviteeEmail,
    inviteeNome,
    perms: body.perms,
  });
  if (!invite) return NextResponse.json({ error: "Convite inválido." }, { status: 400 });

  const origin = new URL(request.url).origin;
  const link = `${origin}/admin/equipe/convite/${invite.token}`;

  if (process.env.EMAIL_TO && process.env.GMAIL_APP_PASSWORD) {
    await transporter.sendMail({
      from: '"Psy Manager" <ellensmpsi@gmail.com>',
      to: invite.inviteeEmail,
      subject: `Convite de secretária — ${ownerNome}`,
      html: `<p>Olá${inviteeNome ? ` ${inviteeNome}` : ""},</p>
        <p>${ownerNome} convidou você para atuar como secretária no Psy Manager (agenda, cadastro e financeiro, sem acesso ao prontuário).</p>
        <p><a href="${link}">Aceitar convite</a></p>`,
    });
  }

  return NextResponse.json({ token: invite.token, link, emailSent: Boolean(process.env.EMAIL_TO) });
}
