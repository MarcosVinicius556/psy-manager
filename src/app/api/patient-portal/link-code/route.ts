import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { patientOwnedByUid } from "@/lib/server/clinic-access";
import { createPatientLinkCode, revokePendingLinkCodes } from "@/lib/server/patient-portal/link-codes";
import { requireAuthUser } from "@/lib/server/require-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });

  const url = new URL(request.url);
  const patientId = url.searchParams.get("patientId")?.trim() || "";
  if (!patientId) return NextResponse.json({ reason: "patientId_obrigatorio" }, { status: 400 });
  if (!(await patientOwnedByUid(patientId, auth.uid))) {
    return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  }

  const pending = await db
    .collection("patientLinkCodes")
    .where("ownerUid", "==", auth.uid)
    .where("patientId", "==", patientId)
    .where("status", "==", "pendente")
    .orderBy("expiresAtMillis", "desc")
    .limit(1)
    .get();

  if (pending.empty) return NextResponse.json({ code: null });

  const doc = pending.docs[0]!.data();
  const expiresAtMillis = Number(doc.expiresAtMillis) || 0;
  if (expiresAtMillis <= Date.now()) {
    return NextResponse.json({ code: null, expired: true });
  }

  return NextResponse.json({
    status: "pendente",
    expiresAt: doc.expiresAt,
    linked: doc.status === "vinculado",
    usedAt: doc.usedAt || null,
  });
}

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

  const created = await createPatientLinkCode(db, auth.uid, patientId);
  const origin = new URL(request.url).origin;
  return NextResponse.json({
    code: created.code,
    expiresAt: created.expiresAt,
    link: `${origin}${created.linkPath}`,
    linkPath: created.linkPath,
  });
}

export async function DELETE(request: Request) {
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

  await revokePendingLinkCodes(db, auth.uid, patientId);
  return NextResponse.json({ ok: true });
}
