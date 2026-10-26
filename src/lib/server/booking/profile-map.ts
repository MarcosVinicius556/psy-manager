import type { Modality } from "@/lib/admin/types";
import { BOOKING_DEFAULTS } from "@/lib/booking/config";
import type { BookingProfile } from "@/lib/booking/types";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function modalities(value: unknown): Modality[] {
  if (!Array.isArray(value)) return BOOKING_DEFAULTS.modalities;
  const allowed = new Set<Modality>(["online", "presencial"]);
  const list = value.filter((item): item is Modality => typeof item === "string" && allowed.has(item as Modality));
  return list.length ? list : BOOKING_DEFAULTS.modalities;
}

export function mapBookingProfile(slug: string, data: FirebaseFirestore.DocumentData): BookingProfile | null {
  const ownerUid = text(data.ownerUid);
  if (!ownerUid) return null;
  return {
    slug,
    ownerUid,
    enabled: data.enabled === true,
    durationMinutes: Math.min(480, Math.max(5, Number(data.durationMinutes) || BOOKING_DEFAULTS.durationMinutes)),
    bufferMinutes: Math.min(120, Math.max(0, Number(data.bufferMinutes) || BOOKING_DEFAULTS.bufferMinutes)),
    advanceDays: Math.min(60, Math.max(1, Number(data.advanceDays) || BOOKING_DEFAULTS.advanceDays)),
    minNoticeHours: Math.min(168, Math.max(0, Number(data.minNoticeHours) || BOOKING_DEFAULTS.minNoticeHours)),
    modalities: modalities(data.modalities),
    acceptNewPatients: data.acceptNewPatients !== false,
    locationId: text(data.locationId) || null,
    professionalMemberId: text(data.professionalMemberId) || null,
    displayName: text(data.displayName) || "Profissional",
    updatedAt: text(data.updatedAt) || new Date().toISOString(),
  };
}

export function bookingProfilePayload(
  profile: Omit<BookingProfile, "updatedAt"> & { updatedAt?: string }
): Record<string, unknown> {
  return {
    ownerUid: profile.ownerUid,
    enabled: profile.enabled,
    durationMinutes: profile.durationMinutes,
    bufferMinutes: profile.bufferMinutes,
    advanceDays: profile.advanceDays,
    minNoticeHours: profile.minNoticeHours,
    modalities: profile.modalities,
    acceptNewPatients: profile.acceptNewPatients,
    locationId: profile.locationId,
    professionalMemberId: profile.professionalMemberId,
    displayName: profile.displayName,
    updatedAt: profile.updatedAt || new Date().toISOString(),
  };
}
