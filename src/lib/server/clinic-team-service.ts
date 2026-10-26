import { randomBytes } from "node:crypto";
import { getAdminDb } from "@/lib/firebase-admin";
import type { ClinicAccount, ClinicInvite, ClinicMemberRole } from "@/lib/team/types";
import { addLocationMemberFromClinicAccept } from "./clinic-location-service";
import { mergeTeamClaims } from "./team-claims";

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function token() {
  return randomBytes(24).toString("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function ensureClinicForAdmin(adminUid: string, nome: string) {
  const db = getAdminDb();
  if (!db) return null;
  const existing = await db.collection("clinics").where("adminUid", "==", adminUid).limit(1).get();
  if (!existing.empty) {
    const doc = existing.docs[0];
    const data = doc.data() as ClinicAccount;
    return { ...data, id: doc.id };
  }
  const id = token().slice(0, 20);
  const clinic: ClinicAccount = {
    id,
    nome: nome.trim() || "Clínica",
    adminUid,
    memberUids: [],
    createdAt: new Date().toISOString(),
  };
  await db.collection("clinics").doc(id).set(clinic);
  await mergeTeamClaims(adminUid, { clinicId: id, clinicRole: "admin" });
  return clinic;
}

export async function createClinicInvite(input: {
  clinicId: string;
  clinicNome: string;
  inviterUid: string;
  inviterNome: string;
  inviteeEmail: string;
  inviteeNome: string;
  role: ClinicMemberRole;
}) {
  const db = getAdminDb();
  if (!db) return null;
  const docToken = token();
  const now = Date.now();
  const invite: ClinicInvite = {
    token: docToken,
    clinicId: input.clinicId,
    clinicNome: input.clinicNome.trim(),
    inviterUid: input.inviterUid,
    inviterNome: input.inviterNome.trim(),
    inviteeEmail: normalizeEmail(input.inviteeEmail),
    inviteeNome: input.inviteeNome.trim(),
    role: input.role,
    status: "pendente",
    createdAt: new Date(now).toISOString(),
    expiresAtMillis: now + INVITE_TTL_MS,
  };
  if (!invite.inviteeEmail) return null;
  await db.collection("clinicInvites").doc(docToken).set(invite);
  return invite;
}

export async function acceptClinicInvite(input: {
  token: string;
  uid: string;
  email: string;
  nome: string;
}) {
  const db = getAdminDb();
  if (!db) return { ok: false as const, reason: "indisponivel" };
  const ref = db.collection("clinicInvites").doc(input.token);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false as const, reason: "convite_invalido" };
  const invite = snap.data() as ClinicInvite;
  if (invite.status !== "pendente") return { ok: false as const, reason: "convite_indisponivel" };
  if (invite.expiresAtMillis <= Date.now()) return { ok: false as const, reason: "convite_expirado" };
  if (normalizeEmail(input.email) !== invite.inviteeEmail) return { ok: false as const, reason: "email_divergente" };

  const clinicRef = db.collection("clinics").doc(invite.clinicId);
  await db.runTransaction(async (tx) => {
    const clinicSnap = await tx.get(clinicRef);
    if (!clinicSnap.exists) throw new Error("clinica_inexistente");
    const data = clinicSnap.data() || {};
    const memberUids = Array.isArray(data.memberUids) ? [...data.memberUids] : [];
    if (!memberUids.includes(input.uid)) memberUids.push(input.uid);
    tx.update(clinicRef, { memberUids });
    tx.set(
      ref,
      {
        status: "aceito",
        acceptedByUid: input.uid,
        acceptedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  });

  await mergeTeamClaims(input.uid, { clinicId: invite.clinicId, clinicRole: invite.role });
  await addLocationMemberFromClinicAccept(invite.clinicId, input.uid);
  const dbAfter = getAdminDb();
  const locationId =
    dbAfter && (await dbAfter.collection("clinics").doc(invite.clinicId).get()).data()?.locationId;
  return {
    ok: true as const,
    clinicId: invite.clinicId,
    role: invite.role,
    locationId: typeof locationId === "string" ? locationId : null,
  };
}
