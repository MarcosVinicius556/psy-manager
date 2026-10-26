import { NextResponse } from "next/server";
import { emptyClinical, type ClinicalRecord } from "@/lib/admin/types";
import { appointmentOwnedByUid } from "@/lib/server/clinic-access";
import {
  clinicalFieldEncryptionConfigured,
  decryptClinicalRecord,
  encryptClinicalRecord,
} from "@/lib/server/clinical-field-encryption";
import { recordClinicalAccess } from "@/lib/server/clinical-access-log";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuthUser } from "@/lib/server/require-auth";

export const runtime = "nodejs";

function isClinicalRecord(value: unknown): value is ClinicalRecord {
  return Boolean(value && typeof value === "object");
}

export async function GET(request: Request, context: { params: Promise<{ appointmentId: string }> }) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;

  const { appointmentId } = await context.params;
  if (!appointmentId) return NextResponse.json({ reason: "id_ausente" }, { status: 400 });
  if (!(await appointmentOwnedByUid(appointmentId, auth.uid))) {
    return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });

  const appt = await db.collection("appointments").doc(appointmentId).get();
  if (!appt.exists) return NextResponse.json({ reason: "nao_encontrado" }, { status: 404 });
  const patientId = typeof appt.data()?.patientId === "string" ? appt.data()!.patientId : "";

  const snap = await db.collection("clinicalRecords").doc(appointmentId).get();
  const clinical = snap.exists
    ? await decryptClinicalRecord(db, auth.uid, snap.data() || {})
    : emptyClinical();

  const logAccess = request.headers.get("x-clinical-access-log") !== "0";
  if (logAccess && patientId) {
    const label = auth.email || auth.uid;
    await recordClinicalAccess(db, {
      uid: auth.uid,
      ownerUid: auth.uid,
      patientId,
      userLabel: label,
    }).catch((error) => console.warn("clinical access log:", error));
  }

  return NextResponse.json({
    clinical,
    encryptionEnabled: clinicalFieldEncryptionConfigured(),
  });
}

export async function PUT(request: Request, context: { params: Promise<{ appointmentId: string }> }) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;

  const { appointmentId } = await context.params;
  if (!appointmentId) return NextResponse.json({ reason: "id_ausente" }, { status: 400 });
  if (!(await appointmentOwnedByUid(appointmentId, auth.uid))) {
    return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });

  const appt = await db.collection("appointments").doc(appointmentId).get();
  if (!appt.exists) return NextResponse.json({ reason: "nao_encontrado" }, { status: 404 });
  const patientId = typeof appt.data()?.patientId === "string" ? appt.data()!.patientId : "";
  if (!patientId) return NextResponse.json({ reason: "paciente_ausente" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reason: "corpo_invalido" }, { status: 400 });
  }
  const clinical = (body as { clinical?: unknown })?.clinical;
  if (!isClinicalRecord(clinical)) {
    return NextResponse.json({ reason: "prontuario_invalido" }, { status: 400 });
  }

  const { enc, clinical: plain } = await encryptClinicalRecord(db, auth.uid, clinical);
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    ownerUid: auth.uid,
    patientId,
    appointmentId,
    updatedAt: now,
  };
  if (enc) {
    payload.enc = enc;
    payload.clinical = null;
  } else {
    payload.clinical = plain ?? clinical;
    payload.enc = null;
  }

  await db.collection("clinicalRecords").doc(appointmentId).set(payload, { merge: true });
  return NextResponse.json({ success: true, encryptionEnabled: clinicalFieldEncryptionConfigured() });
}
