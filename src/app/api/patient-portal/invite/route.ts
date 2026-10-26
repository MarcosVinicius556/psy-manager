import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { patientEmailForUid, patientOwnedByUid } from "@/lib/server/clinic-access";
import { PORTAL_INVITE_TTL_MS } from "@/lib/server/patient-portal/types";
import { requireAuthUser } from "@/lib/server/require-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reason: "corpo_invalido" }, { status: 400 });
  }
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const patientId = typeof payload.patientId === "string" ? payload.patientId.trim() : "";
  if (!patientId) return NextResponse.json({ reason: "patientId_obrigatorio" }, { status: 400 });
  if (!(await patientOwnedByUid(patientId, auth.uid))) {
    return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  }

  const patientSnap = await db.collection("patients").doc(patientId).get();
  if (!patientSnap.exists || patientSnap.data()?.portalAtivo !== true) {
    return NextResponse.json({ reason: "portal_desativado" }, { status: 400 });
  }

  const contact = await patientEmailForUid(patientId, auth.uid);
  const email =
    typeof payload.email === "string" && payload.email.trim()
      ? payload.email.trim().toLowerCase()
      : contact?.email || "";

  const token = crypto.randomUUID();
  const now = Date.now();
  const expiresAtMillis = now + PORTAL_INVITE_TTL_MS;
  const createdAt = new Date(now).toISOString();
  const expiresAt = new Date(expiresAtMillis).toISOString();

  await db.collection("portalInvites").doc(token).set({
    ownerUid: auth.uid,
    patientId,
    email,
    createdAt,
    expiresAt,
    expiresAtMillis,
    usedAt: null,
    usedAtMillis: null,
  });

  return NextResponse.json({
    token,
    expiresAt,
    link: `/paciente/convite/${token}`,
    email,
  });
}
