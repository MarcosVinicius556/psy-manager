import type { Modality } from "@/lib/admin/types";

export type BookingRequestStatus = "pendente" | "aprovado" | "recusado" | "expirado";

export type BookingProfile = {
  slug: string;
  ownerUid: string;
  enabled: boolean;
  durationMinutes: number;
  bufferMinutes: number;
  advanceDays: number;
  minNoticeHours: number;
  modalities: Modality[];
  acceptNewPatients: boolean;
  /** Local padrão para sessões presenciais aprovadas pelo link. */
  locationId: string | null;
  professionalMemberId: string | null;
  displayName: string;
  updatedAt: string;
};

export type BookingSlot = {
  date: string;
  startTime: string;
  endTime: string;
};

export type BookingAvailabilityDoc = {
  ownerUid: string;
  updatedAtMillis: number;
  slots: BookingSlot[];
};

export type PublicBookingView = {
  enabled: boolean;
  professionalName: string;
  durationMinutes: number;
  modalities: Modality[];
  slots: BookingSlot[];
};

export type BookingRequest = {
  id: string;
  ownerUid: string;
  slug: string;
  status: BookingRequestStatus;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  modality: Modality;
  date: string;
  startTime: string;
  endTime: string;
  consentimentoEm: string;
  createdAtMillis: number;
  appointmentId?: string | null;
  patientId?: string | null;
};
