import type { Firestore } from "firebase-admin/firestore";
import { getAdminAuth } from "@/lib/firebase-admin";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function setPatientCustomClaims(uid: string, ownerUid: string, patientId: string) {
  const adminAuth = getAdminAuth();
  if (!adminAuth) return;
  if (!ownerUid || !patientId) {
    await adminAuth.setCustomUserClaims(uid, { role: "paciente" });
    return;
  }
  await adminAuth.setCustomUserClaims(uid, {
    role: "paciente",
    patientOf: { ownerUid, patientId },
  });
}

export async function ensurePatientUserDoc(db: Firestore, uid: string, email: string) {
  const now = new Date().toISOString();
  const userRef = db.collection("users").doc(uid);
  const existing = await userRef.get();
  const existingRole = existing.data()?.role;
  if (existingRole === "psicologo" || existingRole === "super_admin" || existingRole === "support") {
    throw new Error("conta_profissional");
  }
  await userRef.set(
    {
      uid,
      email: normalizeEmail(email),
      role: "paciente",
      billingAccess: "legado",
      subscriptionStatus: "legado",
      accountStatus: "ativa",
      pushPrefs: existing.data()?.pushPrefs || {
        sessoes: true,
        documentos: true,
        diario: true,
        escalas: true,
        silencioNoturno: true,
      },
      portalPrefs: existing.data()?.portalPrefs || {
        theme: "sistema",
        motion: "sistema",
      },
      createdAt: existing.data()?.createdAt || now,
      updatedAt: now,
    },
    { merge: true }
  );
}
