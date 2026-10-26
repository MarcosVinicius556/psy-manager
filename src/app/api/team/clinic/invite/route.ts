import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getAdminDb } from "@/lib/firebase-admin";
import { createClinicInvite } from "@/lib/server/clinic-team-service";
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
  if (ctx.workspace.kind !== "owner" && ctx.workspace.clinicRole !== "admin") {
    return NextResponse.json({ reason: "proibido" }, { status: 403 });
  }
  const limited = await enforceEmailRateLimit(ctx.auth.uid);
  if (limited) return limited;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });

  const body = await request.json();
  const clinicId = typeof body.clinicId === "string" ? body.clinicId : ctx.workspace.clinicId;
  if (!clinicId) return NextResponse.json({ error: "Clínica não encontrada." }, { status: 400 });
  const clinicSnap = await db.collection("clinics").doc(clinicId).get();
  if (!clinicSnap.exists || clinicSnap.data()?.adminUid !== ctx.auth.uid) {
    return NextResponse.json({ reason: "proibido" }, { status: 403 });
  }

  const invite = await createClinicInvite({
    clinicId,
    clinicNome: String(clinicSnap.data()?.nome || "Clínica"),
    inviterUid: ctx.auth.uid,
    inviterNome: typeof body.inviterNome === "string" ? body.inviterNome : "Administrador",
    inviteeEmail: typeof body.inviteeEmail === "string" ? body.inviteeEmail : "",
    inviteeNome: typeof body.inviteeNome === "string" ? body.inviteeNome : "",
    role: "profissional",
  });
  if (!invite) return NextResponse.json({ error: "Convite inválido." }, { status: 400 });

  const link = `${new URL(request.url).origin}/admin/equipe/clinica/convite/${invite.token}`;
  if (process.env.EMAIL_TO && process.env.GMAIL_APP_PASSWORD) {
    await transporter.sendMail({
      from: '"Psy Manager" <ellensmpsi@gmail.com>',
      to: invite.inviteeEmail,
      subject: `Convite para clínica ${invite.clinicNome}`,
      html: `<p>Olá${invite.inviteeNome ? ` ${invite.inviteeNome}` : ""},</p>
        <p>Você foi convidado(a) para integrar a clínica <strong>${invite.clinicNome}</strong> no Psy Manager.</p>
        <p><a href="${link}">Aceitar convite</a></p>`,
    });
  }

  return NextResponse.json({ token: invite.token, link });
}
