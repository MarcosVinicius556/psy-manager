import { randomBytes } from "node:crypto";
import { getAdminDb } from "@/lib/firebase-admin";
import type { StaffInvite, StaffMember, StaffPermission } from "@/lib/team/types";
import { STAFF_PERMISSIONS } from "@/lib/team/types";
import { mergeTeamClaims } from "./team-claims";

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function token() {
  return randomBytes(24).toString("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function parsePerms(raw: unknown): StaffPermission[] {
  if (!Array.isArray(raw)) return STAFF_PERMISSIONS;
  const filtered = raw.filter((item): item is StaffPermission => STAFF_PERMISSIONS.includes(item as StaffPermission));
  return filtered.length ? filtered : STAFF_PERMISSIONS;
}

export async function createStaffInvite(input: {
  ownerUid: string;
  ownerNome: string;
  inviteeEmail: string;
  inviteeNome: string;
  perms?: StaffPermission[];
}) {
  const db = getAdminDb();
  if (!db) return null;
  const inviteeEmail = normalizeEmail(input.inviteeEmail);
  if (!inviteeEmail) return null;
  const docToken = token();
  const now = Date.now();
  const invite: StaffInvite = {
    token: docToken,
    ownerUid: input.ownerUid,
    ownerNome: input.ownerNome.trim(),
    inviteeEmail,
    inviteeNome: input.inviteeNome.trim(),
    perms: parsePerms(input.perms),
    status: "pendente",
    createdAt: new Date(now).toISOString(),
    expiresAtMillis: now + INVITE_TTL_MS,
  };
  await db.collection("staffInvites").doc(docToken).set(invite);
  return invite;
}

export async function acceptStaffInvite(input: { token: string; staffUid: string; staffEmail: string; staffNome: string }) {
  const db = getAdminDb();
  if (!db) return { ok: false as const, reason: "indisponivel" };
  const ref = db.collection("staffInvites").doc(input.token);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false as const, reason: "convite_invalido" };
  const invite = snap.data() as StaffInvite;
  if (invite.status !== "pendente") return { ok: false as const, reason: "convite_indisponivel" };
  if (invite.expiresAtMillis <= Date.now()) {
    await ref.set({ status: "expirado" }, { merge: true });
    return { ok: false as const, reason: "convite_expirado" };
  }
  if (normalizeEmail(input.staffEmail) !== invite.inviteeEmail) {
    return { ok: false as const, reason: "email_divergente" };
  }
  const memberId = `${invite.ownerUid}_${input.staffUid}`;
  const member: StaffMember = {
    id: memberId,
    ownerUid: invite.ownerUid,
    staffUid: input.staffUid,
    email: invite.inviteeEmail,
    nome: input.staffNome.trim() || invite.inviteeNome || invite.inviteeEmail,
    perms: invite.perms,
    ativo: true,
    createdAt: new Date().toISOString(),
  };
  await db.collection("staffMembers").doc(memberId).set(member);
  await ref.set(
    {
      status: "aceito",
      acceptedByUid: input.staffUid,
      acceptedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  await db.collection("users").doc(input.staffUid).set(
    {
      uid: input.staffUid,
      email: invite.inviteeEmail,
      nome: member.nome,
      role: "secretaria",
      billingAccess: "restrito",
      subscriptionStatus: "cortesia",
      accountStatus: "ativa",
      planId: "equipe",
    },
    { merge: true }
  );
  await mergeTeamClaims(input.staffUid, { staffOf: invite.ownerUid, staffPerms: invite.perms });
  return { ok: true as const, ownerUid: invite.ownerUid, member };
}

export async function revokeStaffAccess(ownerUid: string, staffUid: string) {
  const db = getAdminDb();
  if (!db) return false;
  const memberId = `${ownerUid}_${staffUid}`;
  const ref = db.collection("staffMembers").doc(memberId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.set({ ativo: false, revokedAt: new Date().toISOString() }, { merge: true });
  await mergeTeamClaims(staffUid, { staffOf: null, staffPerms: null });
  return true;
}
