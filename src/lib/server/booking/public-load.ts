import type { Firestore } from "firebase-admin/firestore";
import type { PublicBookingView } from "@/lib/booking/types";
import { mapBookingProfile } from "./profile-map";

export async function loadPublicBookingBySlug(db: Firestore, slug: string): Promise<PublicBookingView | null> {
  const profileSnap = await db.collection("bookingProfiles").doc(slug).get();
  if (!profileSnap.exists) return null;
  const profile = mapBookingProfile(profileSnap.id, profileSnap.data() || {});
  if (!profile || !profile.enabled) {
    return {
      enabled: false,
      professionalName: profile?.displayName || "Profissional",
      durationMinutes: profile?.durationMinutes || 50,
      modalities: profile?.modalities || ["online"],
      slots: [],
    };
  }

  const availabilitySnap = await db.collection("bookingAvailability").doc(profile.ownerUid).get();
  const slots = Array.isArray(availabilitySnap.data()?.slots) ? availabilitySnap.data()!.slots : [];

  return {
    enabled: true,
    professionalName: profile.displayName,
    durationMinutes: profile.durationMinutes,
    modalities: profile.modalities,
    slots: slots
      .filter(
        (item: unknown) =>
          item &&
          typeof item === "object" &&
          typeof (item as { date?: unknown }).date === "string" &&
          typeof (item as { startTime?: unknown }).startTime === "string" &&
          typeof (item as { endTime?: unknown }).endTime === "string"
      )
      .map((item: { date: string; startTime: string; endTime: string }) => ({
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
      })),
  };
}
