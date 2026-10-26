import type { Firestore } from "firebase-admin/firestore";
import { formatDate } from "@/lib/admin/format";
import type { AppointmentStatus, Modality } from "@/lib/admin/types";
import { sessionStartMillis } from "@/lib/admin/schedule";
import { syncAppointmentTargets } from "@/lib/google-calendar/sync-service";
import { sendProfessionalEmail, userEmailConnected } from "@/lib/email-integration/send-service";
import { slotStillFree } from "@/lib/booking/compute-availability";
import { googleBusyBlocksForScheduling } from "@/lib/google-calendar/busy-service";
import { refreshBookingAvailabilityForOwner } from "./refresh-availability";
import { mapBookingProfile } from "./profile-map";
import { sendPushToUser } from "@/lib/server/web-push";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function loadTemplate(db: Firestore, ownerUid: string) {
  const snap = await db.collection("emailTemplates").where("ownerUid", "==", ownerUid).get();
  const doc = snap.docs.find((item) => {
    const data = item.data();
    return data.trigger === "confirmacao_agendamento" && data.arquivado !== true;
  });
  if (!doc) return null;
  const data = doc.data();
  return {
    id: doc.id,
    nome: text(data.nome) || "Confirmação de agendamento",
    assunto: text(data.assunto),
    corpo: text(data.corpo),
  };
}

async function findOrCreatePatient(
  db: Firestore,
  ownerUid: string,
  nome: string,
  email: string,
  telefone: string
) {
  const normalized = email.toLowerCase();
  const existing = await db.collection("patients").where("ownerUid", "==", ownerUid).get();
  const match = existing.docs.find((doc) => text(doc.data().email).toLowerCase() === normalized);
  if (match) {
    const patch: Record<string, unknown> = {};
    if (nome && !text(match.data().nome)) patch.nome = nome;
    if (telefone && !text(match.data().telefone)) patch.telefone = telefone;
    if (Object.keys(patch).length) await match.ref.set(patch, { merge: true });
    return match.id;
  }

  const now = new Date().toISOString();
  const ref = await db.collection("patients").add({
    ownerUid,
    nome,
    email: normalized,
    telefone,
    cpf: "",
    cpfPagador: "",
    cpfBeneficiario: "",
    nascimento: "",
    endereco: "",
    contatoEmergencia: "",
    observacoes: "",
    foto: "",
    status: "ativo",
    lembretesEmail: true,
    createdAt: now,
  });
  return ref.id;
}

export async function approveBookingRequest(db: Firestore, ownerUid: string, requestId: string) {
  const requestRef = db.collection("bookingRequests").doc(requestId);
  const requestSnap = await requestRef.get();
  if (!requestSnap.exists || requestSnap.data()?.ownerUid !== ownerUid) {
    return { ok: false, reason: "nao_encontrado" as const };
  }
  const request = requestSnap.data()!;
  if (request.status !== "pendente") return { ok: false, reason: "status_invalido" as const };

  const slug = text(request.slug);
  const profileSnap = await db.collection("bookingProfiles").doc(slug).get();
  const profile = profileSnap.exists ? mapBookingProfile(slug, profileSnap.data() || {}) : null;
  if (!profile || profile.ownerUid !== ownerUid) return { ok: false, reason: "perfil" as const };

  const slot = {
    date: text(request.date),
    startTime: text(request.startTime),
    endTime: text(request.endTime),
  };

  let memberSnap = profile.professionalMemberId
    ? await db.collection("members").doc(profile.professionalMemberId).get()
    : null;
  if (!memberSnap?.exists) {
    memberSnap = (await db.collection("members").where("uid", "==", ownerUid).limit(1).get()).docs[0] ?? null;
  }
  if (!memberSnap?.exists) return { ok: false, reason: "profissional" as const };
  const member = memberSnap.data()!;
  if (member.ownerUid !== ownerUid) return { ok: false, reason: "profissional" as const };

  const workHours = Array.isArray(member.workHours) ? member.workHours : [];
  const today = slot.date;
  const busyBlocks = await googleBusyBlocksForScheduling(ownerUid, today, today).catch(() => []);

  const appointmentsSnap = await db.collection("appointments").where("ownerUid", "==", ownerUid).get();
  const appointments = appointmentsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      date: text(data.date),
      startTime: text(data.startTime),
      endTime: text(data.endTime),
      status: (text(data.status) || "agendado") as AppointmentStatus,
    };
  });

  const pendingSnap = await db.collection("bookingRequests").where("ownerUid", "==", ownerUid).get();
  const pendingRequests = pendingSnap.docs
    .filter((doc) => doc.id !== requestId && doc.data().status === "pendente")
    .map((doc) => {
      const data = doc.data();
      return { date: text(data.date), startTime: text(data.startTime), endTime: text(data.endTime) };
    });

  const stillFree = slotStillFree(slot, {
    workHours,
    durationMinutes: profile.durationMinutes,
    bufferMinutes: profile.bufferMinutes,
    appointments,
    pendingRequests,
    busyBlocks,
  });
  if (!stillFree) return { ok: false, reason: "horario_indisponivel" as const };

  const modality = (text(request.modality) === "presencial" ? "presencial" : "online") as Modality;
  const patientId = await findOrCreatePatient(
    db,
    ownerUid,
    text(request.patientName),
    text(request.patientEmail),
    text(request.patientPhone)
  );

  const valorBase = typeof member.valorBase === "number" ? member.valorBase : 0;
  const now = new Date().toISOString();
  const appointmentRef = db.collection("appointments").doc();
  const locationId = modality === "presencial" ? profile.locationId : null;

  await db.runTransaction(async (tx) => {
    const fresh = await tx.get(requestRef);
    if (!fresh.exists || fresh.data()?.status !== "pendente") throw new Error("status");
    tx.set(appointmentRef, {
      ownerUid,
      accessUids: [ownerUid],
      patientId,
      professionalId: memberSnap.id,
      locationId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      modality,
      sessionType: "padrao",
      valor: valorBase > 0 ? valorBase : 1,
      valorSocial: false,
      packageId: null,
      packageVersao: null,
      creditoEmHaver: false,
      faltaJustificativa: "",
      recurring: false,
      seriesId: null,
      status: "agendado",
      googleEventId: null,
      googleLocationEventId: null,
      googleMeetLink: null,
      sessionStartMillis: sessionStartMillis(slot.date, slot.startTime),
      createdAt: now,
      updatedAt: now,
    });
    tx.update(requestRef, {
      status: "aprovado",
      appointmentId: appointmentRef.id,
      patientId,
      resolvedAt: now,
      resolvedAtMillis: Date.now(),
    });
  });

  await syncAppointmentTargets(appointmentRef.id, "upsert").catch((error) => {
    console.warn("approveBookingRequest: sync Google ignorado.", error);
  });

  const patientEmail = text(request.patientEmail).toLowerCase();
  if (patientEmail && (await userEmailConnected(ownerUid))) {
    const template = await loadTemplate(db, ownerUid);
    const profissionalNome = text(member.nome) || profile.displayName;
    const subjectTemplate =
      template?.assunto || "Sessão confirmada — {{data_sessao}} às {{hora_sessao}}";
    const bodyTemplate =
      template?.corpo ||
      `Olá, {{paciente_nome}}.

Sua sessão com {{profissional_nome}} foi confirmada para **{{data_sessao}}** às **{{hora_sessao}}**.

{{local_sessao}}

Atenciosamente,
{{profissional_nome}}`;

    const placeLabel = modality === "online" ? "Online — o link será enviado antes da sessão." : "Presencial";
    try {
      await sendProfessionalEmail({
        ownerUid,
        to: patientEmail,
        subjectTemplate,
        bodyTemplate,
        context: {
          paciente_nome: text(request.patientName),
          profissional_nome: profissionalNome,
          data_sessao: formatDate(slot.date),
          hora_sessao: slot.startTime,
          local_sessao: placeLabel,
        },
        templateId: template?.id ?? null,
        templateNome: template?.nome ?? null,
        patientId,
        relatedType: "booking_request",
        relatedId: requestId,
      });
    } catch (error) {
      console.warn("approveBookingRequest: e-mail não enviado.", error);
    }
  }

  await refreshBookingAvailabilityForOwner(db, ownerUid);

  await sendPushToUser(
    db,
    ownerUid,
    {
      kind: "agenda",
      title: "Agendamento confirmado",
      body: `Sessão de ${slot.startTime} em ${formatDate(slot.date)} aprovada.`,
      url: `/admin/atendimentos/${appointmentRef.id}`,
    },
    Date.now()
  );

  return { ok: true as const, appointmentId: appointmentRef.id };
}

export async function rejectBookingRequest(db: Firestore, ownerUid: string, requestId: string) {
  const ref = db.collection("bookingRequests").doc(requestId);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.ownerUid !== ownerUid) return { ok: false, reason: "nao_encontrado" as const };
  if (snap.data()?.status !== "pendente") return { ok: false, reason: "status_invalido" as const };
  const now = new Date().toISOString();
  await ref.update({
    status: "recusado",
    resolvedAt: now,
    resolvedAtMillis: Date.now(),
  });
  await refreshBookingAvailabilityForOwner(db, ownerUid);
  return { ok: true as const };
}

export async function notifyNewBookingRequest(
  db: Firestore,
  ownerUid: string,
  requestId: string,
  date: string,
  startTime: string
) {
  await sendPushToUser(
    db,
    ownerUid,
    {
      kind: "agenda",
      title: "Novo pedido de agendamento",
      body: `Pedido para ${formatDate(date)} às ${startTime}. Aprove na agenda.`,
      url: `/admin/agenda?bookingRequest=${encodeURIComponent(requestId)}`,
    },
    Date.now()
  );
}
