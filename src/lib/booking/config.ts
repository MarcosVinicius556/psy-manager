import type { Modality } from "@/lib/admin/types";

/** Defaults do link público — altere aqui se o Marcos ajustar a política padrão. */
export const BOOKING_DEFAULTS = {
  enabled: false,
  durationMinutes: 50,
  bufferMinutes: 10,
  advanceDays: 21,
  minNoticeHours: 24,
  modalities: ["online", "presencial"] as Modality[],
  acceptNewPatients: true,
};

export const BOOKING_AVAILABILITY_DAYS = 21;

export const BOOKING_SLUG_MIN = 3;
export const BOOKING_SLUG_MAX = 40;

export const BOOKING_REJECT_RETENTION_DAYS = 30;
