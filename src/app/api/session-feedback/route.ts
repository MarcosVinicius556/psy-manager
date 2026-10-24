import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { feedbackOwnedByUid, patientEmailForUid } from "@/lib/server/clinic-access";
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
    const feedbackId = typeof body.feedbackId === "string" ? body.feedbackId.trim() : "";
    if (!feedbackId) {
      return NextResponse.json({ error: "Dados do feedback incompletos" }, { status: 400 });
    }
    if (!(await feedbackOwnedByUid(feedbackId, auth.uid))) {
      return NextResponse.json({ error: "Sem permissão para este feedback." }, { status: 403 });
    }

    const db = getAdminDb()!;
    const feedbackSnap = await db.collection("sessionFeedbacks").doc(feedbackId).get();
    const feedback = feedbackSnap.data() || {};
    const patientId = typeof feedback.patientId === "string" ? feedback.patientId : "";
    const professionalNome = typeof feedback.professionalNome === "string" ? feedback.professionalNome.trim() : "";
    const expiresAt = typeof feedback.expiresAt === "string" ? feedback.expiresAt : "";
    const answeredAt = feedback.answeredAt;
    if (!patientId || !professionalNome) {
      return NextResponse.json({ error: "Dados do feedback incompletos" }, { status: 400 });
    }
    if (answeredAt) {
      return NextResponse.json({ error: "Este feedback já foi respondido." }, { status: 400 });
    }
    if (expiresAt && Date.parse(expiresAt) <= Date.now()) {
      return NextResponse.json({ error: "O link de feedback expirou." }, { status: 400 });
    }

    const patient = await patientEmailForUid(patientId, auth.uid);
    if (!patient) {
      return NextResponse.json({ error: "Paciente sem e-mail cadastrado." }, { status: 400 });
    }

    if (!process.env.EMAIL_TO || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({ error: "Envio de e-mail não configurado" }, { status: 500 });
    }

    const origin = new URL(req.url).origin;
    const link = `${origin}/feedback/${feedbackId}`;

    await transporter.sendMail({
      from: '"Psy Manager" <ellensmpsi@gmail.com>',
      to: patient.email,
      subject: "Como foi o seu atendimento?",
      html: `
        <p>Olá${patient.nome ? ` ${escapeHtml(patient.nome)}` : ""},</p>
        <p>${escapeHtml(professionalNome)} gostaria de saber como foi o atendimento. A avaliação leva um instante: de 1 a 5 estrelas e, se quiser, um comentário.</p>
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
