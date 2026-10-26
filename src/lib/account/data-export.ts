import { zipSync, strToU8 } from "fflate";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/admin/firebase";

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

export type ExportProgress = { phase: string; done: number; total: number | null };

export async function buildAccountExportZip(
  ownerUid: string,
  onProgress?: (progress: ExportProgress) => void
) {
  const db = getFirebaseDb();
  const report = (phase: string, done: number, total: number | null = null) => onProgress?.({ phase, done, total });

  report("Pacientes", 0, null);
  const patientsSnap = await getDocs(query(collection(db, "patients"), where("ownerUid", "==", ownerUid), limit(PAGE)));
  const patients = patientsSnap.docs.map((snap) => ({ id: snap.id, ...snap.data() }));

  report("Sessões", 0, null);
  const appointmentsSnap = await getDocs(query(collection(db, "appointments"), where("ownerUid", "==", ownerUid), limit(PAGE)));
  const appointments = appointmentsSnap.docs
    .map((snap) => ({ id: snap.id, ...snap.data() }))
    .sort(
      (a, b) =>
        Number((b as { sessionStartMillis?: number }).sessionStartMillis || 0) -
        Number((a as { sessionStartMillis?: number }).sessionStartMillis || 0)
    );

  report("Financeiro", 0, null);
  const paymentsSnap = await getDocs(query(collection(db, "payments"), where("ownerUid", "==", ownerUid), limit(PAGE)));
  const payments = paymentsSnap.docs.map((snap) => ({ id: snap.id, ...snap.data() }));

  report("Prontuários", 0, null);
  const clinicalSnap = await getDocs(query(collection(db, "clinicalRecords"), where("ownerUid", "==", ownerUid), limit(PAGE)));
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

  report("Compactando", 1, 1);
  const zipped = zipSync(files, { level: 6 });
  return new Blob([zipped], { type: "application/zip" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
