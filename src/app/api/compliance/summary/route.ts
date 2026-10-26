import { NextResponse } from "next/server";
import { emptyClinical } from "@/lib/admin/types";
import { decryptClinicalRecord } from "@/lib/server/clinical-field-encryption";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuthUser } from "@/lib/server/require-auth";

export const runtime = "nodejs";

const RETENTION_YEARS = 5;

function yearsSince(iso: string) {
  if (!iso) return 0;
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return 0;
  return (Date.now() - then) / (365.25 * 24 * 60 * 60 * 1000);
}

function sessionHasEvolution(clinical: ReturnType<typeof emptyClinical>) {
  const textFields = [
    clinical.clinicalEvolution,
    clinical.evolucaoSessao,
    clinical.notes,
    clinical.restrictedNote,
    ...Object.values(clinical.sections || {}),
  ];
  return textFields.some((value) => typeof value === "string" && value.trim().length > 20);
}

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;

  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });

  const patientsSnap = await db.collection("patients").where("ownerUid", "==", auth.uid).get();
  const appointmentsSnap = await db.collection("appointments").where("ownerUid", "==", auth.uid).get();
  const accessSnap = await db.collection("clinicalAccessLog").where("ownerUid", "==", auth.uid).limit(200).get();

  type PatientRow = Record<string, unknown> & { id: string };
  type AppointmentRow = Record<string, unknown> & { id: string };
  const patients: PatientRow[] = patientsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const appointments: AppointmentRow[] = appointmentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const clinicalByAppointment = new Map<string, Awaited<ReturnType<typeof decryptClinicalRecord>>>();
  for (const appt of appointments.filter((item) => item.status === "concluido")) {
    const snap = await db.collection("clinicalRecords").doc(appt.id as string).get();
    if (!snap.exists) {
      clinicalByAppointment.set(appt.id as string, emptyClinical());
      continue;
    }
    clinicalByAppointment.set(
      appt.id as string,
      await decryptClinicalRecord(db, auth.uid, snap.data() || {})
    );
  }

  const pendencias = patients.map((patient) => {
    const patientId = patient.id as string;
    const nome = typeof patient.nome === "string" ? patient.nome : "";
    const status = typeof patient.status === "string" ? patient.status : "ativo";
    const tcle = patient.tcleAceite;
    const contrato = patient.contratoAssinado;
    const missingTcle = !tcle;
    const missingContrato = !contrato;

    const concluded = appointments.filter(
      (item) => item.patientId === patientId && item.status === "concluido"
    );
    const missingEvolution = concluded.filter((item) => {
      const clinical = clinicalByAppointment.get(item.id as string) ?? emptyClinical();
      return !sessionHasEvolution(clinical);
    });

    const lastSession = concluded
      .map((item) => String(item.date || ""))
      .sort()
      .pop();
    const inactiveRetention =
      status === "inativo" && lastSession && yearsSince(lastSession) >= RETENTION_YEARS;

    return {
      patientId,
      nome,
      missingTcle,
      missingContrato,
      sessionsWithoutEvolution: missingEvolution.length,
      inactiveRetentionAlert: Boolean(inactiveRetention),
    };
  });

  const totals = {
    missingTcle: pendencias.filter((item) => item.missingTcle).length,
    missingContrato: pendencias.filter((item) => item.missingContrato).length,
    sessionsWithoutEvolution: pendencias.reduce((sum, item) => sum + item.sessionsWithoutEvolution, 0),
    retentionAlerts: pendencias.filter((item) => item.inactiveRetentionAlert).length,
  };

  const accessLog = accessSnap.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        patientId: typeof data.patientId === "string" ? data.patientId : "",
        accessorLabel: typeof data.accessorLabel === "string" ? data.accessorLabel : "",
        day: typeof data.day === "string" ? data.day : "",
        count: Number(data.count) || 0,
        lastAccessAt: typeof data.lastAccessAt === "string" ? data.lastAccessAt : "",
      };
    })
    .sort((a, b) => b.lastAccessAt.localeCompare(a.lastAccessAt))
    .slice(0, 50);

  return NextResponse.json({
    totals,
    patients: pendencias,
    accessLog,
    encryptionEnabled: Boolean(process.env.CLINICAL_FIELD_ENC_KEY?.trim()),
  });
}
