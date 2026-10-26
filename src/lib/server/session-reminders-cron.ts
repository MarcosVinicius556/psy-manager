import crypto from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { formatDate } from "@/lib/admin/format";
import { claimAutomationSend } from "@/lib/email-integration/idempotency";
import { sendProfessionalEmail, userEmailConnected } from "@/lib/email-integration/send-service";
import type { EmailTemplate } from "@/lib/email-integration/types";
import { getSiteUrl } from "@/lib/site";
import { tomorrowBrasiliaBounds } from "./brasilia-time";
import {
  reminderUnsubscribeToken,
  sessionReminderMarkerId,
} from "./session-confirmation";
import { sendPushToUser } from "./web-push";

const BATCH = 120;

function mapEmailTemplate(id: string, data: FirebaseFirestore.DocumentData): EmailTemplate | null {
  const nome = typeof data.nome === "string" ? data.nome : "";
  if (!nome) return null;
  return {
    id,
    nome,
    trigger: (typeof data.trigger === "string" ? data.trigger : "livre") as EmailTemplate["trigger"],
    assunto: typeof data.assunto === "string" ? data.assunto : "",
    corpo: typeof data.corpo === "string" ? data.corpo : "",
    anexo: (typeof data.anexo === "string" ? data.anexo : "nenhum") as EmailTemplate["anexo"],
    autoSend: Boolean(data.autoSend),
    arquivado: Boolean(data.arquivado),
    versao: Number(data.versao) || 1,
    historico: [],
    createdAt: typeof data.createdAt === "string" ? data.createdAt : "",
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : "",
  };
}

function appointmentPlaceLabel(data: FirebaseFirestore.DocumentData, locationName: string) {
  if (data.modality === "online") {
    const meet = typeof data.googleMeetLink === "string" ? data.googleMeetLink.trim() : "";
    return meet ? `Online — ${meet}` : "Online";
  }
  return locationName ? `Presencial — ${locationName}` : "Presencial";
}

export async function runSessionRemindersCron(db: Firestore, now = Date.now(), cursor: string | null = null) {
  const { ymd, startMillis, endMillis } = tomorrowBrasiliaBounds(now);
  const site = getSiteUrl();

  let query = db
    .collection("appointments")
    .where("sessionStartMillis", ">=", startMillis)
    .where("sessionStartMillis", "<=", endMillis)
    .orderBy("sessionStartMillis")
    .limit(BATCH);

  if (cursor) {
    const cursorSnap = await db.collection("appointments").doc(cursor).get();
    if (cursorSnap.exists) {
      query = query.startAfter(cursorSnap);
    }
  }

  let snapshot;
  try {
    snapshot = await query.get();
  } catch (error) {
    console.warn("session_reminders: consulta com índice falhou, ignorando lote.", error);
    return { processed: 0, cursor: null, emailsSent: 0, skipped: true };
  }

  let processed = 0;
  let emailsSent = 0;
  let lastId: string | null = null;
  const pushByOwner = new Map<string, number>();

  for (const doc of snapshot.docs) {
    lastId = doc.id;
    const appointment = doc.data();
    if (appointment.status !== "agendado") continue;

    const ownerUid = typeof appointment.ownerUid === "string" ? appointment.ownerUid : "";
    const appointmentId = doc.id;
    const patientId = typeof appointment.patientId === "string" ? appointment.patientId : "";
    if (!ownerUid || !patientId) continue;

    const marker = sessionReminderMarkerId(appointmentId, ymd);
    const claim = await claimAutomationSend(marker, ownerUid);
    if (!claim.claimed) continue;

    processed += 1;

    const patientSnap = await db.collection("patients").doc(patientId).get();
    const patient = patientSnap.data() || {};
    if (patient.lembretesEmail === false) continue;

    const patientEmail = typeof patient.email === "string" ? patient.email.trim().toLowerCase() : "";
    const patientNome = typeof patient.nome === "string" ? patient.nome : "";
    if (!patientEmail) continue;

    if (!(await userEmailConnected(ownerUid))) continue;

    const templatesSnap = await db.collection("emailTemplates").where("ownerUid", "==", ownerUid).get();
    const templateDoc = templatesSnap.docs.find((item) => {
      const data = item.data();
      return data.trigger === "lembrete_sessao" && data.arquivado !== true && data.autoSend === true;
    });
    if (!templateDoc) continue;
    const template = mapEmailTemplate(templateDoc.id, templateDoc.data());
    if (!template) continue;

    const memberSnap = await db.collection("members").where("ownerUid", "==", ownerUid).limit(1).get();
    const profissionalNome =
      typeof memberSnap.docs[0]?.data()?.nome === "string" ? memberSnap.docs[0].data()!.nome : "Profissional";

    const sessionDate = typeof appointment.date === "string" ? appointment.date : ymd;
    const startTime = typeof appointment.startTime === "string" ? appointment.startTime : "";
    const locationId = typeof appointment.locationId === "string" ? appointment.locationId : "";
    let locationName = "";
    if (locationId) {
      const locSnap = await db.collection("locations").doc(locationId).get();
      locationName = typeof locSnap.data()?.nome === "string" ? locSnap.data()!.nome.trim() : "";
    }

    const token = crypto.randomUUID();
    const expiresAtMillis =
      typeof appointment.sessionStartMillis === "number" && appointment.sessionStartMillis > now
        ? appointment.sessionStartMillis
        : now + 36 * 60 * 60 * 1000;

    await db.collection("sessionConfirmations").doc(token).set({
      ownerUid,
      appointmentId,
      patientId,
      professionalNome: profissionalNome,
      sessionDate,
      startTime,
      modality: appointment.modality === "online" ? "online" : "presencial",
      placeLabel: appointmentPlaceLabel(appointment, locationName),
      status: "pendente",
      expiresAt: new Date(expiresAtMillis).toISOString(),
      expiresAtMillis,
      createdAt: new Date(now).toISOString(),
    });

    const confirmUrl = `${site}/confirmar/${token}`;
    const unsubscribeToken = reminderUnsubscribeToken(ownerUid, patientId);
    const unsubscribeUrl = `${site}/api/public/reminders-unsubscribe?ownerUid=${encodeURIComponent(ownerUid)}&patientId=${encodeURIComponent(patientId)}&token=${encodeURIComponent(unsubscribeToken)}`;

    const userSnap = await db.collection("users").doc(ownerUid).get();
    const clinicaNome = typeof userSnap.data()?.clinicName === "string" ? userSnap.data()!.clinicName : "Consultório";

    try {
      await sendProfessionalEmail({
        ownerUid,
        to: patientEmail,
        subjectTemplate: template.assunto,
        bodyTemplate: template.corpo,
        context: {
          paciente_nome: patientNome,
          profissional_nome: profissionalNome,
          clinica_nome: clinicaNome,
          data_sessao: formatDate(sessionDate),
          hora_sessao: startTime,
          local_sessao: appointmentPlaceLabel(appointment, locationName),
          link_confirmar: confirmUrl,
          link_remarcar: confirmUrl,
          link_descadastro: unsubscribeUrl,
        },
        templateId: template.id,
        templateNome: template.nome,
        patientId,
        relatedType: "appointment",
        relatedId: appointmentId,
      });
      emailsSent += 1;
      await doc.ref.set(
        {
          confirmacao: "pendente",
          updatedAt: new Date(now).toISOString(),
        },
        { merge: true }
      );
      pushByOwner.set(ownerUid, (pushByOwner.get(ownerUid) || 0) + 1);
    } catch (error) {
      console.error("session_reminders: falha ao enviar", appointmentId, error);
      await db.collection("emailAutomationMarkers").doc(marker).delete();
    }
  }

  for (const [ownerUid, count] of pushByOwner) {
    await sendPushToUser(
      db,
      ownerUid,
      {
        kind: "agenda",
        title: "Lembretes enviados",
        body: count === 1 ? "1 lembrete de sessão foi enviado para amanhã." : `${count} lembretes de sessão foram enviados para amanhã.`,
        url: "/admin/agenda",
      },
      now
    );
  }

  const partial = snapshot.size >= BATCH;
  return {
    processed,
    emailsSent,
    cursor: partial && lastId ? lastId : null,
    day: ymd,
  };
}
