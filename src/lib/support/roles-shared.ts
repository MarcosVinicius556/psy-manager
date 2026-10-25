export type StaffRole = "super_admin" | "support";

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return role === "super_admin" || role === "support";
}

export function canReviewTicket(role: string): boolean {
  return role === "super_admin" || role === "support";
}
