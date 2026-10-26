import { getAdminDb } from "@/lib/firebase-admin";
import type { ClinicAccount } from "@/lib/team/types";
import { mergeTeamClaims } from "./team-claims";

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function locationProfessionalUids(data: {
  createdByUid?: string;
  memberUids?: unknown;
}): string[] {
  const uids = new Set<string>();
  if (typeof data.createdByUid === "string" && data.createdByUid) uids.add(data.createdByUid);
  for (const uid of strings(data.memberUids)) uids.add(uid);
  return [...uids];
}

export async function readLocation(locationId: string) {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db.collection("locations").doc(locationId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as {
    id: string;
    nome?: string;
    createdByUid?: string;
    memberUids?: string[];
    clinicId?: string;
  };
}

async function linkClinicToLocation(clinicId: string, locationId: string) {
  const db = getAdminDb();
  if (!db) return;
  await db.collection("clinics").doc(clinicId).set({ locationId }, { merge: true });
  await db.collection("locations").doc(locationId).set({ clinicId }, { merge: true });
}

export async function ensureClinicForLocation(locationId: string, adminUid: string, nome?: string) {
  const db = getAdminDb();
  if (!db) return null;
  const location = await readLocation(locationId);
  if (!location || location.createdByUid !== adminUid) return null;

  if (location.clinicId) {
    const linked = await db.collection("clinics").doc(location.clinicId).get();
    if (linked.exists) {
      const data = linked.data() as ClinicAccount;
      return { ...data, id: linked.id };
    }
  }

  const byLocation = await db.collection("clinics").where("locationId", "==", locationId).limit(1).get();
  if (!byLocation.empty) {
    const doc = byLocation.docs[0];
    const clinic = { ...(doc.data() as ClinicAccount), id: doc.id };
    await linkClinicToLocation(doc.id, locationId);
    return clinic;
  }

  const legacy = await db.collection("clinics").where("adminUid", "==", adminUid).limit(5).get();
  const unlinked = legacy.docs.filter((doc) => !doc.data().locationId);
  if (unlinked.length === 1) {
    const doc = unlinked[0];
    const clinic = { ...(doc.data() as ClinicAccount), id: doc.id };
    await linkClinicToLocation(doc.id, locationId);
    if (nome?.trim()) {
      await db.collection("clinics").doc(doc.id).set({ nome: nome.trim() }, { merge: true });
    }
    return { ...clinic, nome: nome?.trim() || clinic.nome };
  }

  const id = `${locationId.slice(0, 12)}_${adminUid.slice(0, 8)}`;
  const clinic: ClinicAccount = {
    id,
    nome: nome?.trim() || location.nome?.trim() || "Local",
    adminUid,
    memberUids: strings(location.memberUids).filter((uid) => uid !== adminUid),
    createdAt: new Date().toISOString(),
  };
  await db.collection("clinics").doc(id).set({ ...clinic, locationId });
  await linkClinicToLocation(id, locationId);
  await mergeTeamClaims(adminUid, { clinicId: id, clinicRole: "admin" });
  return clinic;
}

export async function syncClinicMemberForLocation(locationId: string, memberUid: string) {
  const db = getAdminDb();
  if (!db) return;
  const location = await readLocation(locationId);
  if (!location?.createdByUid) return;
  const clinic = await ensureClinicForLocation(locationId, location.createdByUid, location.nome);
  if (!clinic) return;
  const clinicRef = db.collection("clinics").doc(clinic.id);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(clinicRef);
    if (!snap.exists) return;
    const memberUids = strings(snap.data()?.memberUids);
    if (!memberUids.includes(memberUid)) memberUids.push(memberUid);
    tx.update(clinicRef, { memberUids });
  });
  await mergeTeamClaims(memberUid, { clinicId: clinic.id, clinicRole: "profissional" });
}

export async function addLocationMemberFromClinicAccept(clinicId: string, memberUid: string) {
  const db = getAdminDb();
  if (!db) return;
  const clinicSnap = await db.collection("clinics").doc(clinicId).get();
  if (!clinicSnap.exists) return;
  const locationId = typeof clinicSnap.data()?.locationId === "string" ? clinicSnap.data()!.locationId : "";
  if (!locationId) return;
  const { FieldValue } = await import("firebase-admin/firestore");
  await db.collection("locations").doc(locationId).update({ memberUids: FieldValue.arrayUnion(memberUid) });
}
