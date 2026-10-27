import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { requirePatientSession } from "@/lib/server/patient-portal/auth";
import { listPatientConnections, disconnectPatientConnection } from "@/lib/server/patient-portal/connections";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  const session = await requirePatientSession(request);
  if ("error" in session) return session.error;

  const connections = await listPatientConnections(session.db, session.uid);
  for (const conn of connections) {
    try {
      await disconnectPatientConnection(session.db, session.uid, conn.id);
    } catch {
      /* segue desvinculando */
    }
  }

  await session.db.collection("patientAccounts").doc(session.uid).delete();

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
