import { NextResponse } from "next/server";
import { emptyClinical } from "@/lib/admin/types";
import { appointmentOwnedByUid } from "@/lib/server/clinic-access";
import { decryptClinicalRecord, encryptClinicalRecord } from "@/lib/server/clinical-field-encryption";
import { decryptFormResponses } from "@/lib/server/form-response-store";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuthUser } from "@/lib/server/require-auth";

export const runtime = "nodejs";

function formatAnswers(respostas: Record<string, string>) {
  return Object.entries(respostas)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });

  const snap = await db.collection("formResponses").doc(id).get();
  if (!snap.exists || snap.data()?.ownerUid !== auth.uid) {
    return NextResponse.json({ reason: "nao_encontrado" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reason: "corpo_invalido" }, { status: 400 });
  }
  const appointmentId = typeof (body as { appointmentId?: string })?.appointmentId === "string"
    ? (body as { appointmentId: string }).appointmentId.trim()
    : "";
  if (!appointmentId || !(await appointmentOwnedByUid(appointmentId, auth.uid))) {
    return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  }

  const appt = await db.collection("appointments").doc(appointmentId).get();
  const patientId = typeof appt.data()?.patientId === "string" ? appt.data()!.patientId : "";
  if (patientId !== snap.data()?.patientId) {
    return NextResponse.json({ reason: "paciente_incompativel" }, { status: 400 });
  }

  const respostas = decryptFormResponses(snap.data() || {});
  const block = `--- Anamnese (formulário ${snap.data()?.templateId ?? ""}) ---\n${formatAnswers(respostas)}`;

  const clinicalSnap = await db.collection("clinicalRecords").doc(appointmentId).get();
  const clinical = clinicalSnap.exists
    ? await decryptClinicalRecord(db, auth.uid, clinicalSnap.data() || {})
    : emptyClinical();
  const next = {
    ...clinical,
    sections: {
      ...clinical.sections,
      anamnese_formulario: block,
    },
    clinicalEvolution: clinical.clinicalEvolution
      ? `${clinical.clinicalEvolution}\n\n${block}`
      : block,
  };

  const { enc, clinical: plain } = await encryptClinicalRecord(db, auth.uid, next);
  const now = new Date().toISOString();
  await db.collection("clinicalRecords").doc(appointmentId).set(
    {
      ownerUid: auth.uid,
      patientId,
      appointmentId,
      updatedAt: now,
      enc: enc ?? null,
      clinical: enc ? null : plain ?? next,
    },
    { merge: true }
  );

  return NextResponse.json({ success: true });
}
