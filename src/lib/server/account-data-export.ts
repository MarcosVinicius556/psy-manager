import { zipSync, strToU8 } from "fflate";
import type { Firestore } from "firebase-admin/firestore";

const PAGE = 500;

function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(",")];
  for (const row of rows) {
    lines.push(keys.map((key) => csvEscape(row[key])).join(","));
  }
  return lines.join("\n");
}

export async function buildAccountExportZipBytes(db: Firestore, ownerUid: string) {
  const patientsSnap = await db
    .collection("patients")
    .where("ownerUid", "==", ownerUid)
    .limit(PAGE)
    .get();
  const patients = patientsSnap.docs.map((snap) => ({ id: snap.id, ...snap.data() }));

  const appointmentsSnap = await db
    .collection("appointments")
    .where("ownerUid", "==", ownerUid)
    .limit(PAGE)
    .get();
  const appointments = appointmentsSnap.docs
    .map((snap) => ({ id: snap.id, ...snap.data() }))
    .sort(
      (a, b) =>
        Number((b as { sessionStartMillis?: number }).sessionStartMillis || 0) -
        Number((a as { sessionStartMillis?: number }).sessionStartMillis || 0)
    );

  const paymentsSnap = await db
    .collection("payments")
    .where("ownerUid", "==", ownerUid)
    .limit(PAGE)
    .get();
  const payments = paymentsSnap.docs.map((snap) => ({ id: snap.id, ...snap.data() }));

  const clinicalSnap = await db
    .collection("clinicalRecords")
    .where("ownerUid", "==", ownerUid)
    .limit(PAGE)
    .get();
  const clinical = clinicalSnap.docs.map((snap) => ({ id: snap.id, ...snap.data() }));

  const manifest = {
    exportedAt: new Date().toISOString(),
    ownerUid,
    counts: {
      patients: patients.length,
      appointments: appointments.length,
      payments: payments.length,
      clinicalRecords: clinical.length,
    },
  };

  const files: Record<string, Uint8Array> = {
    "manifest.json": strToU8(JSON.stringify(manifest, null, 2)),
    "pacientes.json": strToU8(JSON.stringify(patients, null, 2)),
    "sessoes.json": strToU8(JSON.stringify(appointments, null, 2)),
    "pagamentos.json": strToU8(JSON.stringify(payments, null, 2)),
    "prontuarios.json": strToU8(JSON.stringify(clinical, null, 2)),
    "pacientes.csv": strToU8(toCsv(patients as Record<string, unknown>[])),
    "pagamentos.csv": strToU8(toCsv(payments as Record<string, unknown>[])),
  };

  return zipSync(files, { level: 6 });
}
