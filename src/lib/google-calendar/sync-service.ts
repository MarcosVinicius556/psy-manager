import { getAdminDb } from "@/lib/firebase-admin";
import type { Appointment, Patient } from "@/lib/admin/types";
import { appointmentEventTitle, appointmentToGoogleEventBody } from "./event-mapping";
import { locationIntegrationKey, userIntegrationKey } from "./integration-keys";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getValidAccessToken,
  updateCalendarEvent,
} from "./google-api";
import { memberUidForProfessionalId } from "./access";
import { locationIntegrationApplies, professionalIntegrationApplies } from "./sync-routing";
import { readIntegration } from "./store";

type AppointmentDoc = Appointment & { ownerUid?: string };

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
  return { id: snap.id, ...(snap.data() as Omit<AppointmentDoc, "id">) } as AppointmentDoc;
}

async function loadPatient(clinicOwnerUid: string, patientId: string) {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db.collection("patients").doc(patientId).get();
  if (!snap.exists) return null;
  const data = snap.data() as Patient & { ownerUid?: string };
  if (data.ownerUid && data.ownerUid !== clinicOwnerUid) return null;
  return data as Patient;
}

async function syncOneCalendar(options: {
  integrationKey: string;
  appointmentId: string;
  appointment: AppointmentDoc;
  action: "upsert" | "delete";
  eventField: "googleEventId" | "googleLocationEventId";
  title: string;
  includePatientInTitle: boolean;
  clinicOwnerUid: string;
}) {
  const integration = await readIntegration(options.integrationKey);
  if (!integration?.refreshTokenEncrypted || !integration.syncToGoogle || !integration.calendarId) {
    return { ok: true, skipped: true as const };
  }
  const accessToken = await getValidAccessToken(options.integrationKey);
  const calendarId = integration.calendarId;
  const existingEventId = options.appointment[options.eventField];

  if (options.action === "delete" || options.appointment.status === "cancelado") {
    if (!existingEventId) return { ok: true, skipped: true as const };
    await deleteCalendarEvent(accessToken, calendarId, existingEventId);
    const ref = appointmentDoc(options.appointmentId);
    if (ref) {
      await ref.update({
        [options.eventField]: null,
        updatedAt: new Date().toISOString(),
      });
    }
    return { ok: true };
  }

  const patient = options.includePatientInTitle
    ? await loadPatient(options.clinicOwnerUid, options.appointment.patientId)
    : undefined;
  const resolvedTitle = options.includePatientInTitle
    ? appointmentEventTitle(integration.eventTitleMode, patient ?? undefined)
    : options.title;
  const body = appointmentToGoogleEventBody(options.appointment, resolvedTitle);

  if (existingEventId) {
    await updateCalendarEvent(accessToken, calendarId, existingEventId, body);
    return { ok: true, googleEventId: existingEventId };
  }

  const eventId = await createCalendarEvent(accessToken, calendarId, body);
  const ref = appointmentDoc(options.appointmentId);
  if (ref) {
    await ref.update({
      [options.eventField]: eventId,
      updatedAt: new Date().toISOString(),
    });
  }
  return { ok: true, googleEventId: eventId };
}

export async function syncAppointmentForUser(uid: string, appointmentId: string, action: "upsert" | "delete") {
  return syncAppointmentTargets(appointmentId, action);
}

export async function syncAppointmentTargets(appointmentId: string, action: "upsert" | "delete") {
  const appointment = await loadAppointment(appointmentId);
  if (!appointment) return { ok: false, reason: "atendimento_nao_encontrado" };

  const professionalUid = await memberUidForProfessionalId(appointment.professionalId);
  const professionalIntegration = professionalUid ? await readIntegration(userIntegrationKey(professionalUid)) : null;
  const memberIdForProfessional = appointment.professionalId;

  const results: Record<string, unknown> = {};

  if (
    professionalUid &&
    professionalIntegrationApplies(professionalIntegration, appointment, professionalUid, memberIdForProfessional)
  ) {
    results.professional = await syncOneCalendar({
      integrationKey: userIntegrationKey(professionalUid),
      appointmentId,
      appointment,
      action,
      eventField: "googleEventId",
      title: "Atendimento",
      includePatientInTitle: true,
      clinicOwnerUid: appointment.ownerUid || professionalUid,
    });
  }

  if (appointment.locationId) {
    const locationKey = locationIntegrationKey(appointment.locationId);
    const locationIntegration = await readIntegration(locationKey);
    if (locationIntegrationApplies(locationIntegration, appointment)) {
      results.location = await syncOneCalendar({
        integrationKey: locationKey,
        appointmentId,
        appointment,
        action,
        eventField: "googleLocationEventId",
        title: "Consultório ocupado",
        includePatientInTitle: false,
        clinicOwnerUid: appointment.ownerUid || professionalUid || "",
      });
    }
  }

  return { ok: true, results };
}
