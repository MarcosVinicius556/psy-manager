import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { patientOwnedByUid } from "@/lib/server/clinic-access";
import { requireAuthUser } from "@/lib/server/require-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  const url = new URL(request.url);
  const patientId = url.searchParams.get("patientId")?.trim() || "";
  if (!patientId) return NextResponse.json({ reason: "patientId_obrigatorio" }, { status: 400 });
  if (!(await patientOwnedByUid(patientId, auth.uid))) {
    return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  }
  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });
  const snap = await db.collection("patients").doc(patientId).get();
  const data = snap.data() || {};
  return NextResponse.json({
    portalAtivo: data.portalAtivo === true,
    patientAuthUid: typeof data.patientAuthUid === "string" ? data.patientAuthUid : null,
    email: typeof data.email === "string" ? data.email : "",
  });
}

export async function PATCH(request: Request) {
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

  const portalAtivo = payload.portalAtivo === true;
  const now = new Date().toISOString();
  await db.collection("patients").doc(patientId).set({ portalAtivo, updatedAt: now }, { merge: true });
  return NextResponse.json({ ok: true, portalAtivo });
}
