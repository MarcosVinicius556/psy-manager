import { getAdminDb } from "@/lib/firebase-admin";
import { claimsFromToken, parseStaffPerms } from "@/lib/team/claims";
import type { ClinicMemberRole, StaffPermission, WorkspaceContext } from "@/lib/team/types";
import { verifyFirebaseIdToken } from "./verify-id-token";

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function readIdTokenClaims(idToken: string) {
  const auth = await import("@/lib/firebase-admin").then((m) => m.getAdminAuth());
  if (auth) {
    try {
      const decoded = await auth.verifyIdToken(idToken);
      return { uid: decoded.uid, email: decoded.email?.toLowerCase() || "", claims: decoded };
    } catch {
      return null;
    }
  }
  const identity = await verifyFirebaseIdToken(idToken);
  if (!identity) return null;
  return { uid: identity.uid, email: identity.email, claims: {} as Record<string, unknown> };
}

export async function staffMemberActive(ownerUid: string, staffUid: string) {
  const db = getAdminDb();
  if (!db) return false;
  const id = `${ownerUid}_${staffUid}`;
  const snap = await db.collection("staffMembers").doc(id).get();
  if (!snap.exists) return false;
  const data = snap.data() || {};
  return data.ativo === true && data.ownerUid === ownerUid && data.staffUid === staffUid;
}

export async function clinicMemberRole(clinicId: string, uid: string): Promise<ClinicMemberRole | null> {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db.collection("clinics").doc(clinicId).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  if (data.adminUid === uid) return "admin";
  if (strings(data.memberUids).includes(uid)) return "profissional";
  return null;
}

export async function resolveWorkspace(idToken: string): Promise<WorkspaceContext | null> {
  const decoded = await readIdTokenClaims(idToken);
  if (!decoded) return null;
  const tokenClaims = claimsFromToken(decoded.claims as Record<string, unknown>);
  const actorUid = decoded.uid;

  if (tokenClaims.staffOf) {
    const active = await staffMemberActive(tokenClaims.staffOf, actorUid);
    if (!active) {
      return {
        kind: "owner",
        tenantOwnerUid: actorUid,
        actorUid,
        staffPerms: [],
        clinicId: tokenClaims.clinicId ?? null,
        clinicRole: tokenClaims.clinicRole ?? null,
        isClinicalAllowed: true,
      };
    }
    const perms = parseStaffPerms(tokenClaims.staffPerms);
    return {
      kind: "secretaria",
      tenantOwnerUid: tokenClaims.staffOf,
      actorUid,
      staffPerms: perms.length ? perms : ["agenda", "pacientes", "financeiro"],
      clinicId: tokenClaims.clinicId ?? null,
      clinicRole: tokenClaims.clinicRole ?? null,
      isClinicalAllowed: false,
    };
  }

  if (tokenClaims.clinicId && tokenClaims.clinicRole) {
    const role = await clinicMemberRole(tokenClaims.clinicId, actorUid);
    if (!role) {
      return {
        kind: tokenClaims.clinicRole === "admin" ? "clinica_admin" : "clinica_profissional",
        tenantOwnerUid: actorUid,
        actorUid,
        staffPerms: [],
        clinicId: tokenClaims.clinicId,
        clinicRole: tokenClaims.clinicRole,
        isClinicalAllowed: tokenClaims.clinicRole !== "admin",
      };
    }
    return {
      kind: role === "admin" ? "clinica_admin" : "clinica_profissional",
      tenantOwnerUid: actorUid,
      actorUid,
      staffPerms: [],
      clinicId: tokenClaims.clinicId,
      clinicRole: role,
      isClinicalAllowed: role !== "admin",
    };
  }

  return {
    kind: "owner",
    tenantOwnerUid: actorUid,
    actorUid,
    staffPerms: [],
    clinicId: null,
    clinicRole: null,
    isClinicalAllowed: true,
  };
}

export async function assertTenantAccess(workspace: WorkspaceContext, ownerUid: string) {
  if (workspace.tenantOwnerUid === ownerUid && workspace.kind === "owner") return true;
  if (workspace.kind === "secretaria" && workspace.tenantOwnerUid === ownerUid) return true;
  if (workspace.kind === "clinica_admin" && workspace.clinicId) {
    const role = await clinicMemberRole(workspace.clinicId, ownerUid);
    return role === "profissional" || ownerUid === workspace.actorUid;
  }
  return false;
}

export async function clinicAdminMemberUids(clinicId: string, adminUid: string) {
  const db = getAdminDb();
  if (!db) return [];
  const snap = await db.collection("clinics").doc(clinicId).get();
  if (!snap.exists || snap.data()?.adminUid !== adminUid) return [];
  const members = strings(snap.data()?.memberUids);
  return [adminUid, ...members.filter((uid) => uid !== adminUid)].slice(0, 30);
}

export function staffHasPerm(workspace: WorkspaceContext, perm: StaffPermission) {
  if (workspace.kind !== "secretaria") return true;
  return workspace.staffPerms.includes(perm);
}
