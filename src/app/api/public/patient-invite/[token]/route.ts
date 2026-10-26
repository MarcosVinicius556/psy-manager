import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { isValidPublicToken } from "@/lib/server/public-token";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!isValidPublicToken(token)) return NextResponse.json({ reason: "token_invalido" }, { status: 400 });
  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });

  const snap = await db.collection("portalInvites").doc(token).get();
  if (!snap.exists) return NextResponse.json({ reason: "convite_invalido" }, { status: 404 });
  const data = snap.data() || {};
  const expiresAtMillis = Number(data.expiresAtMillis) || 0;
  if (expiresAtMillis && expiresAtMillis <= Date.now()) {
    return NextResponse.json({ reason: "convite_expirado", expired: true }, { status: 410 });
  }
  if (data.usedAtMillis) {
    return NextResponse.json({ reason: "convite_usado", used: true }, { status: 410 });
  }

  const patientId = typeof data.patientId === "string" ? data.patientId : "";
  const patientSnap = patientId ? await db.collection("patients").doc(patientId).get() : null;
  const patientNome = patientSnap?.exists && typeof patientSnap.data()?.nome === "string" ? patientSnap.data()!.nome : "Paciente";

  return NextResponse.json({
    patientNome,
    email: typeof data.email === "string" ? data.email : "",
    expiresAt: typeof data.expiresAt === "string" ? data.expiresAt : "",
  });
}
