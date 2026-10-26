import { getFirebaseAuth } from "@/lib/admin/firebase";

let tenantOwnerUid: string | null = null;

/** Effective psychologist tenant for Firestore queries (staff acts on behalf of owner). */
export function setTenantOwnerUid(uid: string | null) {
  tenantOwnerUid = uid;
}

export function getTenantOwnerUid() {
  return tenantOwnerUid;
}

export function effectiveOwnerUid() {
  const authUid = getFirebaseAuth().currentUser?.uid;
  if (!authUid) throw new Error("Faça login para continuar.");
  return tenantOwnerUid ?? authUid;
}

export function isDelegatedTenantAccess() {
  const authUid = getFirebaseAuth().currentUser?.uid;
  return Boolean(tenantOwnerUid && authUid && tenantOwnerUid !== authUid);
}
