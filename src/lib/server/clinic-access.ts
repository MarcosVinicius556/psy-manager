import { getAdminDb } from "@/lib/firebase-admin";

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function patientOwnedByUid(patientId: string, uid: string) {
  const db = getAdminDb();
  if (!db) return false;
  const snap = await db.collection("patients").doc(patientId).get();
  if (!snap.exists) return false;
  return snap.data()?.ownerUid === uid;
}

export async function appointmentAccessibleByUid(appointmentId: string, uid: string) {
  const db = getAdminDb();
  if (!db) return false;
  const snap = await db.collection("appointments").doc(appointmentId).get();
  if (!snap.exists) return false;
  const data = snap.data() || {};
  if (data.ownerUid === uid) return true;
  return strings(data.accessUids).includes(uid);
}

export async function paymentOwnedByUid(paymentId: string, uid: string) {
  const db = getAdminDb();
  if (!db) return false;
  const snap = await db.collection("payments").doc(paymentId).get();
  if (!snap.exists) return false;
  return snap.data()?.ownerUid === uid;
}

export async function feedbackOwnedByUid(feedbackId: string, uid: string) {
  const db = getAdminDb();
  if (!db) return false;
  const snap = await db.collection("sessionFeedbacks").doc(feedbackId).get();
  if (!snap.exists) return false;
  return snap.data()?.ownerUid === uid;
}

export async function locationInviteSendableByUid(inviteId: string, uid: string) {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db.collection("locationInvites").doc(inviteId).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  if (data.ownerUid !== uid || data.status !== "pendente") return null;
  return {
    inviteeEmail: typeof data.inviteeEmail === "string" ? data.inviteeEmail.trim().toLowerCase() : "",
    inviteeNome: typeof data.inviteeNome === "string" ? data.inviteeNome.trim() : "",
    locationNome: typeof data.locationNome === "string" ? data.locationNome.trim() : "",
    inviterNome: typeof data.inviterNome === "string" ? data.inviterNome.trim() : "",
  };
}

export async function patientEmailForUid(patientId: string, uid: string) {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db.collection("patients").doc(patientId).get();
  if (!snap.exists || snap.data()?.ownerUid !== uid) return null;
  const email = typeof snap.data()?.email === "string" ? snap.data()!.email.trim().toLowerCase() : "";
  const nome = typeof snap.data()?.nome === "string" ? snap.data()!.nome.trim() : "";
  if (!email) return null;
  return { email, nome };
}
