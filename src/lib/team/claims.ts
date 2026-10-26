import type { ClinicMemberRole, StaffPermission } from "./types";
import { STAFF_PERMISSIONS } from "./types";

export type TeamTokenClaims = {
  staffOf?: string;
  staffPerms?: string[];
  clinicId?: string;
  clinicRole?: ClinicMemberRole;
};

export function parseStaffPerms(raw: unknown): StaffPermission[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is StaffPermission => STAFF_PERMISSIONS.includes(item as StaffPermission));
}

export function claimsFromToken(token: Record<string, unknown> | undefined): TeamTokenClaims {
  if (!token) return {};
  const staffOf = typeof token.staffOf === "string" && token.staffOf ? token.staffOf : undefined;
  const clinicId = typeof token.clinicId === "string" && token.clinicId ? token.clinicId : undefined;
  const clinicRole =
    token.clinicRole === "admin" || token.clinicRole === "profissional" ? token.clinicRole : undefined;
  return {
    staffOf,
    staffPerms: parseStaffPerms(token.staffPerms),
    clinicId,
    clinicRole,
  };
}
