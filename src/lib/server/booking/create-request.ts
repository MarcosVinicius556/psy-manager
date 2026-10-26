import type { Firestore } from "firebase-admin/firestore";
import type { AppointmentStatus, Modality } from "@/lib/admin/types";
import { isValidRecipientEmail, normalizeRecipientEmail } from "@/lib/email-integration/validate-email";
import { slotStillFree } from "@/lib/booking/compute-availability";
import { googleBusyBlocksForScheduling } from "@/lib/google-calendar/busy-service";
import { refreshBookingAvailabilityForOwner } from "./refresh-availability";
import { mapBookingProfile } from "./profile-map";
import { notifyNewBookingRequest } from "./approve-request";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeName(value: string) {
  return value.trim().slice(0, 120);
}

function sanitizePhone(value: string) {
  return value.replace(/[^\d+()\s-]/g, "").trim().slice(0, 40);
}

export type CreateBookingRequestInput = {
  slug: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  modality: Modality;
  date: string;
  startTime: string;
  endTime: string;
  consent: boolean;
  honeypot?: string;
};

export async function createPublicBookingRequest(db: Firestore, input: CreateBookingRequestInput, ip: string) {
  if (input.honeypot && input.honeypot.trim()) {
    return { ok: false, reason: "spam" as const };
  }
  if (!input.consent) return { ok: false, reason: "consentimento" as const };

  const nome = sanitizeName(input.patientName);
  if (nome.length < 2) return { ok: false, reason: "nome" as const };

  const email = normalizeRecipientEmail(input.patientEmail);
  if (!isValidRecipientEmail(email)) return { ok: false, reason: "email" as const };

  const telefone = sanitizePhone(input.patientPhone);
  if (telefone.length < 8) return { ok: false, reason: "telefone" as const };

  const profileSnap = await db.collection("bookingProfiles").doc(input.slug).get();
  if (!profileSnap.exists) return { ok: false, reason: "indisponivel" as const };
  const profile = mapBookingProfile(input.slug, profileSnap.data() || {});
  if (!profile?.enabled) return { ok: false, reason: "indisponivel" as const };

  if (!profile.modalities.includes(input.modality)) return { ok: false, reason: "modalidade" as const };

  if (!profile.acceptNewPatients) {
    const patients = await db.collection("patients").where("ownerUid", "==", profile.ownerUid).get();
    const known = patients.docs.some((doc) => text(doc.data().email).toLowerCase() === email);
    if (!known) return { ok: false, reason: "somente_pacientes" as const };
  }

  const slot = { date: input.date, startTime: input.startTime, endTime: input.endTime };
  if (slot.endTime <= slot.startTime) return { ok: false, reason: "horario" as const };

  let memberSnap = profile.professionalMemberId
    ? await db.collection("members").doc(profile.professionalMemberId).get()
    : null;
  if (!memberSnap?.exists) {
    memberSnap = (await db.collection("members").where("uid", "==", profile.ownerUid).limit(1).get()).docs[0] ?? null;
  }
  const workHours = Array.isArray(memberSnap?.data()?.workHours) ? memberSnap!.data()!.workHours : [];

  const appointmentsSnap = await db.collection("appointments").where("ownerUid", "==", profile.ownerUid).get();
  const appointments = appointmentsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      date: text(data.date),
      startTime: text(data.startTime),
      endTime: text(data.endTime),
      status: (text(data.status) || "agendado") as AppointmentStatus,
    };
  });

  const pendingSnap = await db.collection("bookingRequests").where("ownerUid", "==", profile.ownerUid).get();
  const pendingRequests = pendingSnap.docs
    .filter((doc) => doc.data().status === "pendente")
    .map((doc) => {
      const data = doc.data();
      return { date: text(data.date), startTime: text(data.startTime), endTime: text(data.endTime) };
    });

  const busyBlocks = await googleBusyBlocksForScheduling(profile.ownerUid, slot.date, slot.date).catch(() => []);

  const free = slotStillFree(slot, {
    workHours,
    durationMinutes: profile.durationMinutes,
    bufferMinutes: profile.bufferMinutes,
    appointments,
    pendingRequests,
    busyBlocks,
  });
  if (!free) return { ok: false, reason: "horario_indisponivel" as const };

  const now = Date.now();
  const stamp = new Date(now).toISOString();
  const ref = await db.collection("bookingRequests").add({
    ownerUid: profile.ownerUid,
    slug: profile.slug,
    status: "pendente",
    patientName: nome,
    patientEmail: email,
    patientPhone: telefone,
    modality: input.modality,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    consentimentoEm: stamp,
    consentIp: ip.slice(0, 64),
    createdAtMillis: now,
  });

  await refreshBookingAvailabilityForOwner(db, profile.ownerUid, now);
  await notifyNewBookingRequest(db, profile.ownerUid, ref.id, slot.date, slot.startTime);

  return { ok: true as const, requestId: ref.id };
}
