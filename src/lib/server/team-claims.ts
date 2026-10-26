import { getAdminAuth } from "@/lib/firebase-admin";
import type { ClinicMemberRole, StaffPermission } from "@/lib/team/types";

export async function mergeTeamClaims(
  uid: string,
  patch: {
    staffOf?: string | null;
    staffPerms?: StaffPermission[] | null;
    clinicId?: string | null;
    clinicRole?: ClinicMemberRole | null;
  }
) {
  const auth = getAdminAuth();
  if (!auth) return false;
  const user = await auth.getUser(uid);
  const existing = (user.customClaims ?? {}) as Record<string, unknown>;
  const next: Record<string, unknown> = { ...existing };
  if ("staffOf" in patch) {
    if (patch.staffOf) next.staffOf = patch.staffOf;
    else delete next.staffOf;
  }
  if ("staffPerms" in patch) {
    if (patch.staffPerms && patch.staffPerms.length) next.staffPerms = patch.staffPerms;
    else delete next.staffPerms;
  }
  if ("clinicId" in patch) {
    if (patch.clinicId) next.clinicId = patch.clinicId;
    else delete next.clinicId;
  }
  if ("clinicRole" in patch) {
    if (patch.clinicRole) next.clinicRole = patch.clinicRole;
    else delete next.clinicRole;
  }
  await auth.setCustomUserClaims(uid, next);
  return true;
}
