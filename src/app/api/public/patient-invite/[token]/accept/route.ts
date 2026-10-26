import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { linkPatientAccount } from "@/lib/server/patient-portal/auth";
import { isValidPublicToken } from "@/lib/server/public-token";
import { requireAuthUser } from "@/lib/server/require-auth";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!isValidPublicToken(token)) return NextResponse.json({ reason: "token_invalido" }, { status: 400 });

  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;

  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });

  const inviteRef = db.collection("portalInvites").doc(token);
  const inviteSnap = await inviteRef.get();
  if (!inviteSnap.exists) return NextResponse.json({ reason: "convite_invalido" }, { status: 404 });
  const invite = inviteSnap.data() || {};
  const expiresAtMillis = Number(invite.expiresAtMillis) || 0;
  if (expiresAtMillis && expiresAtMillis <= Date.now()) {
    return NextResponse.json({ reason: "convite_expirado" }, { status: 410 });
  }
  if (invite.usedAtMillis) return NextResponse.json({ reason: "convite_usado" }, { status: 410 });

  const ownerUid = typeof invite.ownerUid === "string" ? invite.ownerUid : "";
  const patientId = typeof invite.patientId === "string" ? invite.patientId : "";
  if (!ownerUid || !patientId) return NextResponse.json({ reason: "convite_invalido" }, { status: 400 });

  try {
    await linkPatientAccount({
      db,
      uid: auth.uid,
      email: auth.email || (typeof invite.email === "string" ? invite.email : ""),
      ownerUid,
      patientId,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "falha_vinculo";
    return NextResponse.json({ reason: code }, { status: 400 });
  }

  const now = Date.now();
  await inviteRef.update({ usedAt: new Date(now).toISOString(), usedAtMillis: now });

  return NextResponse.json({ ok: true });
}
