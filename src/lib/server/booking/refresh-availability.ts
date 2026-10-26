import type { Firestore } from "firebase-admin/firestore";
import { shiftDate, todayISO } from "@/lib/admin/format";
import { sessionStartMillis } from "@/lib/admin/schedule";
import { googleBusyBlocksForScheduling } from "@/lib/google-calendar/busy-service";
import { computeBookingSlots } from "@/lib/booking/compute-availability";
import type { AppointmentStatus } from "@/lib/admin/types";
import { mapBookingProfile } from "./profile-map";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function loadProfileByOwner(db: Firestore, ownerUid: string) {
  const snap = await db.collection("bookingProfiles").where("ownerUid", "==", ownerUid).limit(5).get();
  for (const doc of snap.docs) {
    const profile = mapBookingProfile(doc.id, doc.data());
    if (profile) return profile;
  }
  return null;
}

async function loadMemberWorkHours(db: Firestore, ownerUid: string, memberId: string | null) {
  if (memberId) {
    const snap = await db.collection("members").doc(memberId).get();
    if (snap.exists && snap.data()?.ownerUid === ownerUid) {
      const hours = snap.data()?.workHours;
      return Array.isArray(hours) ? hours : [];
    }
  }
  const byUid = await db.collection("members").where("uid", "==", ownerUid).limit(1).get();
  const hours = byUid.docs[0]?.data()?.workHours;
  return Array.isArray(hours) ? hours : [];
}

export async function refreshBookingAvailabilityForOwner(db: Firestore, ownerUid: string, now = Date.now()) {
  const profile = await loadProfileByOwner(db, ownerUid);
  if (!profile || !profile.enabled) {
    await db.collection("bookingAvailability").doc(ownerUid).set(
      { ownerUid, updatedAtMillis: now, slots: [] },
      { merge: true }
    );
    return { slots: 0, skipped: !profile ? "sem_perfil" : "desligado" };
  }

  const today = todayISO(new Date(now));
  const endDate = shiftDate(today, profile.advanceDays);
  const startMillis = sessionStartMillis(today, "00:00");
  const endMillis = sessionStartMillis(endDate, "23:59");

  const memberId = profile.professionalMemberId;
  const workHours = await loadMemberWorkHours(db, ownerUid, memberId);

  let appointmentsSnap;
  try {
    appointmentsSnap = await db
      .collection("appointments")
      .where("ownerUid", "==", ownerUid)
      .where("sessionStartMillis", ">=", startMillis)
      .where("sessionStartMillis", "<=", endMillis)
      .get();
  } catch {
    const fallback = await db.collection("appointments").where("ownerUid", "==", ownerUid).get();
    appointmentsSnap = {
      docs: fallback.docs.filter((doc) => {
        const millis = doc.data().sessionStartMillis;
        return typeof millis === "number" && millis >= startMillis && millis <= endMillis;
      }),
    } as FirebaseFirestore.QuerySnapshot;
  }

  const appointments = appointmentsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      date: text(data.date),
      startTime: text(data.startTime),
      endTime: text(data.endTime),
      status: (text(data.status) || "agendado") as AppointmentStatus,
    };
  });

  const requestsSnap = await db.collection("bookingRequests").where("ownerUid", "==", ownerUid).get();
  const pendingRequests = requestsSnap.docs
    .filter((doc) => doc.data().status === "pendente")
    .map((doc) => {
      const data = doc.data();
      return {
        date: text(data.date),
        startTime: text(data.startTime),
        endTime: text(data.endTime),
      };
    });

  const professionalUid = ownerUid;
  const busyBlocks = await googleBusyBlocksForScheduling(professionalUid, today, endDate).catch(() => []);

  const slots = computeBookingSlots({
    workHours,
    durationMinutes: profile.durationMinutes,
    bufferMinutes: profile.bufferMinutes,
    advanceDays: profile.advanceDays,
    minNoticeHours: profile.minNoticeHours,
    appointments,
    pendingRequests,
    busyBlocks,
    now: new Date(now),
  });

  await db.collection("bookingAvailability").doc(ownerUid).set({
    ownerUid,
    updatedAtMillis: now,
    slots,
  });

  return { slots: slots.length };
}

export async function refreshAllEnabledBookingAvailability(db: Firestore, now = Date.now()) {
  const snap = await db.collection("bookingProfiles").where("enabled", "==", true).get();
  let refreshed = 0;
  for (const doc of snap.docs) {
    const profile = mapBookingProfile(doc.id, doc.data());
    if (!profile?.enabled) continue;
    await refreshBookingAvailabilityForOwner(db, profile.ownerUid, now);
    refreshed += 1;
  }
  return { refreshed };
}
