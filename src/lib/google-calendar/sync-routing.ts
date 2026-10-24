import type { Appointment } from "@/lib/admin/types";
import type { GoogleCalendarPrivateRecord } from "./types";

export type ClinicMemberLink = { id: string; uid: string | null };

export function uidForProfessional(professionalId: string | null, members: ClinicMemberLink[]) {
  if (!professionalId) return null;
  const member = members.find((item) => item.id === professionalId);
  return member?.uid || null;
}

export function professionalIntegrationApplies(
  integration: GoogleCalendarPrivateRecord | null | undefined,
  appointment: Pick<Appointment, "professionalId">,
  professionalUid: string | null,
  memberIdForUid: string | null
) {
  if (!integration?.refreshTokenEncrypted || !integration.syncToGoogle || !integration.calendarId) return false;
  if (!professionalUid || !memberIdForUid || !appointment.professionalId) return false;
  return appointment.professionalId === memberIdForUid;
}

export function locationIntegrationApplies(
  integration: GoogleCalendarPrivateRecord | null | undefined,
  appointment: Pick<Appointment, "locationId">
) {
  if (!integration?.refreshTokenEncrypted || !integration.syncToGoogle || !integration.calendarId) return false;
  return Boolean(appointment.locationId);
}

export type BusyDisplayBlock = {
  date: string;
  startTime: string;
  endTime: string;
  label: string;
  masked: boolean;
};

export function labelGoogleBusyBlock(options: {
  viewerUid: string;
  subjectUid: string;
  showTitlesForSubject: boolean;
  rawTitle?: string;
}) {
  const isSelf = options.viewerUid === options.subjectUid;
  if (isSelf && options.showTitlesForSubject && options.rawTitle?.trim()) {
    return { label: options.rawTitle.trim(), masked: false };
  }
  return { label: "Ocupado", masked: true };
}
