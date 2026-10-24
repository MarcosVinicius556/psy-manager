import { getAdminDb } from "@/lib/firebase-admin";
import type { Appointment, Patient } from "@/lib/admin/types";
import { appointmentEventTitle, appointmentToGoogleEventBody } from "./event-mapping";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getValidAccessToken,
  updateCalendarEvent,
} from "./google-api";
import { readIntegration } from "./store";

function appointmentDoc(id: string) {
  const db = getAdminDb();
  if (!db) return null;
  return db.collection("appointments").doc(id);
}

async function loadAppointment(id: string) {
  const ref = appointmentDoc(id);
  if (!ref) return null;
  const snap = await ref.get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Omit<Appointment, "id">) } as Appointment;
}

async function loadPatient(ownerUid: string, patientId: string) {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db.collection("patients").doc(patientId).get();
  if (!snap.exists) return null;
  const data = snap.data() as Patient & { ownerUid?: string };
  if (data.ownerUid && data.ownerUid !== ownerUid) return null;
  return data as Patient;
}

async function loadMemberIdForUid(uid: string) {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db.collection("members").where("uid", "==", uid).limit(1).get();
  const doc = snap.docs[0];
  return doc?.id || null;
}

export async function syncAppointmentForUser(uid: string, appointmentId: string, action: "upsert" | "delete") {
  const integration = await readIntegration(uid);
  if (!integration?.refreshTokenEncrypted || !integration.syncToGoogle || !integration.calendarId) {
    return { ok: true, skipped: true as const };
  }
  const appointment = await loadAppointment(appointmentId);
  if (!appointment) return { ok: false, reason: "atendimento_nao_encontrado" };
  const memberId = await loadMemberIdForUid(uid);
  if (!memberId || appointment.professionalId !== memberId) {
    return { ok: true, skipped: true as const };
  }
  const accessToken = await getValidAccessToken(uid);
  const calendarId = integration.calendarId;

  if (action === "delete" || appointment.status === "cancelado") {
    if (!appointment.googleEventId) return { ok: true, skipped: true as const };
    await deleteCalendarEvent(accessToken, calendarId, appointment.googleEventId);
    const ref = appointmentDoc(appointmentId);
    if (ref) await ref.update({ googleEventId: null, updatedAt: new Date().toISOString() });
    return { ok: true };
  }

  const patient = await loadPatient(uid, appointment.patientId);
  const title = appointmentEventTitle(integration.eventTitleMode, patient ?? undefined);
  const body = appointmentToGoogleEventBody(appointment, title);

  if (appointment.googleEventId) {
    await updateCalendarEvent(accessToken, calendarId, appointment.googleEventId, body);
    return { ok: true, googleEventId: appointment.googleEventId };
  }

  const eventId = await createCalendarEvent(accessToken, calendarId, body);
  const ref = appointmentDoc(appointmentId);
  if (ref) await ref.update({ googleEventId: eventId, updatedAt: new Date().toISOString() });
  return { ok: true, googleEventId: eventId };
}
