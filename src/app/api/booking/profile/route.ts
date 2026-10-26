import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { BOOKING_DEFAULTS } from "@/lib/booking/config";
import type { Modality } from "@/lib/admin/types";
import { requireAuthUser } from "@/lib/server/require-auth";
import { bookingProfilePayload, mapBookingProfile } from "@/lib/server/booking/profile-map";
import { refreshBookingAvailabilityForOwner } from "@/lib/server/booking/refresh-availability";
import { normalizeBookingSlug, validateBookingSlug } from "@/lib/booking/slug";

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if (auth.error) return auth.error;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "indisponivel" }, { status: 503 });

  const snap = await db.collection("bookingProfiles").where("ownerUid", "==", auth.uid).limit(1).get();
  if (!snap.docs[0]) {
    return NextResponse.json({
      profile: null,
      defaults: BOOKING_DEFAULTS,
      publicPath: null,
    });
  }
  const profile = mapBookingProfile(snap.docs[0].id, snap.docs[0].data());
  return NextResponse.json({
    profile,
    publicPath: profile?.enabled ? `/agendar/${profile.slug}` : null,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAuthUser(request);
  if (auth.error) return auth.error;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "indisponivel" }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const memberSnap = await db.collection("members").where("uid", "==", auth.uid).limit(1).get();
  const member = memberSnap.docs[0];
  const displayName = typeof member?.data()?.nome === "string" ? member.data()!.nome : "Profissional";

  const existingSnap = await db.collection("bookingProfiles").where("ownerUid", "==", auth.uid).limit(1).get();
  const existing = existingSnap.docs[0];
  const current = existing ? mapBookingProfile(existing.id, existing.data()) : null;

  const slug = normalizeBookingSlug(
    typeof payload.slug === "string" ? payload.slug : current?.slug || displayName
  );
  const slugError = validateBookingSlug(slug);
  if (slugError) return NextResponse.json({ error: slugError }, { status: 400 });

  const slugOwner = await db.collection("bookingProfiles").doc(slug).get();
  if (slugOwner.exists && slugOwner.data()?.ownerUid !== auth.uid) {
    return NextResponse.json({ error: "Este endereço já está em uso." }, { status: 409 });
  }

  const modalities: Modality[] = Array.isArray(payload.modalities)
    ? payload.modalities.filter((item): item is Modality => item === "online" || item === "presencial")
    : current?.modalities || BOOKING_DEFAULTS.modalities;

  const profile = {
    slug,
    ownerUid: auth.uid,
    enabled: payload.enabled === true,
    durationMinutes: Number(payload.durationMinutes) || current?.durationMinutes || BOOKING_DEFAULTS.durationMinutes,
    bufferMinutes: Number(payload.bufferMinutes) ?? current?.bufferMinutes ?? BOOKING_DEFAULTS.bufferMinutes,
    advanceDays: Number(payload.advanceDays) || current?.advanceDays || BOOKING_DEFAULTS.advanceDays,
    minNoticeHours: Number(payload.minNoticeHours) ?? current?.minNoticeHours ?? BOOKING_DEFAULTS.minNoticeHours,
    modalities: modalities.length ? modalities : BOOKING_DEFAULTS.modalities,
    acceptNewPatients: payload.acceptNewPatients !== false,
    locationId: typeof payload.locationId === "string" ? payload.locationId.trim() || null : current?.locationId ?? null,
    professionalMemberId: member?.id || current?.professionalMemberId || null,
    displayName,
  };

  if (existing && existing.id !== slug) {
    await existing.ref.delete();
  }
  await db.collection("bookingProfiles").doc(slug).set(bookingProfilePayload(profile), { merge: true });

  if (profile.enabled) {
    await refreshBookingAvailabilityForOwner(db, auth.uid);
  } else {
    await db.collection("bookingAvailability").doc(auth.uid).set(
      { ownerUid: auth.uid, updatedAtMillis: Date.now(), slots: [] },
      { merge: true }
    );
  }

  const saved = mapBookingProfile(slug, bookingProfilePayload(profile));
  return NextResponse.json({
    profile: saved,
    publicPath: saved?.enabled ? `/agendar/${slug}` : null,
  });
}
