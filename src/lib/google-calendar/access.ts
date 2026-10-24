import { getAdminDb } from "@/lib/firebase-admin";

export async function appointmentVisibleToUid(appointmentId: string, uid: string) {
  const db = getAdminDb();
  if (!db) return false;
  const snap = await db.collection("appointments").doc(appointmentId).get();
  if (!snap.exists) return false;
  const data = snap.data() as { ownerUid?: string; accessUids?: string[] };
  if (data.ownerUid === uid) return true;
  return Array.isArray(data.accessUids) && data.accessUids.includes(uid);
}

export async function locationOwnedByUid(locationId: string, uid: string) {
  const db = getAdminDb();
  if (!db) return false;
  const snap = await db.collection("locations").doc(locationId).get();
  if (!snap.exists) return false;
  const data = snap.data() as { createdByUid?: string; ownerUid?: string };
  return data.createdByUid === uid || data.ownerUid === uid;
}

export async function locationSharedWithUid(locationId: string, uid: string) {
  const db = getAdminDb();
  if (!db) return false;
  const snap = await db.collection("locations").doc(locationId).get();
  if (!snap.exists) return false;
  const data = snap.data() as { memberUids?: string[]; createdByUid?: string; ownerUid?: string };
  if (data.createdByUid === uid || data.ownerUid === uid) return true;
  return Array.isArray(data.memberUids) && data.memberUids.includes(uid);
}

export async function memberUidForProfessionalId(professionalId: string | null) {
  if (!professionalId) return null;
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db.collection("members").doc(professionalId).get();
  if (!snap.exists) return null;
  const uid = snap.data()?.uid;
  return typeof uid === "string" && uid ? uid : null;
}

export async function memberIdForUid(uid: string) {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db.collection("members").where("uid", "==", uid).limit(1).get();
  return snap.docs[0]?.id || null;
}
