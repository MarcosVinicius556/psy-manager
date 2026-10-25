import { getAdminDb } from "@/lib/firebase-admin";
import { isStaffRole, type StaffRole } from "./roles-shared";

export type { StaffRole };
export { isStaffRole, canReviewTicket } from "./roles-shared";

export async function readUserRole(uid: string): Promise<string> {
  const db = getAdminDb();
  if (!db) return "psicologo";
  const snap = await db.collection("users").doc(uid).get();
  const role = snap.data()?.role;
  if (role === "super_admin" || role === "support") return role;
  return "psicologo";
}

export async function isSupportStaffUid(uid: string): Promise<boolean> {
  const role = await readUserRole(uid);
  return isStaffRole(role);
}
