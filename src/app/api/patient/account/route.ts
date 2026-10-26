import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { requirePatientAuth } from "@/lib/server/patient-portal/auth";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  const session = await requirePatientAuth(request);
  if ("error" in session) return session.error;

  await session.db.collection("patientAccounts").doc(session.uid).delete();
  await session.db.collection("patients").doc(session.link.patientId).set(
    { patientAuthUid: null, updatedAt: new Date().toISOString() },
    { merge: true }
  );
  await session.db.collection("users").doc(session.uid).delete();

  const adminAuth = getAdminAuth();
  if (adminAuth) {
    try {
      await adminAuth.deleteUser(session.uid);
    } catch {
      /* conta já removida */
    }
  }

  return NextResponse.json({ ok: true });
}
