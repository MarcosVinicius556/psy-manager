/**
 * Migra evolução clínica de `appointments.clinical` para `clinicalRecords/{appointmentId}`.
 *
 * Uso (dry-run por padrão):
 *   GOOGLE_APPLICATION_CREDENTIALS=... npx tsx scripts/migrate-clinical-records.ts
 *   GOOGLE_APPLICATION_CREDENTIALS=... npx tsx scripts/migrate-clinical-records.ts --execute
 *
 * NÃO execute em produção sem revisão do responsável.
 */
import { FieldValue } from "firebase-admin/firestore";
import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function sessionStartMillis(date: string, startTime: string) {
  if (!date || !startTime) return 0;
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = startTime.split(":").map(Number);
  if ([year, month, day, hours, minutes].some((n) => Number.isNaN(n))) return 0;
  return new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();
}

function hasClinicalData(clinical: Record<string, unknown> | undefined) {
  if (!clinical || typeof clinical !== "object") return false;
  const textFields = [
    "clinicalEvolution",
    "notes",
    "aspectosCognitivos",
    "aspectosEmocionais",
    "intervencoes",
    "objetivos",
    "evolucaoSessao",
    "mood",
  ];
  if (textFields.some((key) => typeof clinical[key] === "string" && clinical[key].trim())) return true;
  const files = ["anamneseArquivos", "atividadesArquivos"];
  return files.some((key) => Array.isArray(clinical[key]) && clinical[key].length > 0);
}

async function main() {
  const execute = process.argv.includes("--execute");
  if (!getApps().length) {
    initializeApp({ credential: applicationDefault() });
  }
  const db = getFirestore();
  const snapshot = await db.collection("appointments").get();
  let withClinical = 0;
  let migrated = 0;
  let strippedOnly = 0;
  let batch = db.batch();
  let batchCount = 0;

  const flush = async () => {
    if (!execute || batchCount === 0) return;
    await batch.commit();
    batch = db.batch();
    batchCount = 0;
  };

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const ownerUid = typeof data.ownerUid === "string" ? data.ownerUid : "";
    const patientId = typeof data.patientId === "string" ? data.patientId : "";
    const date = typeof data.date === "string" ? data.date : "";
    const startTime = typeof data.startTime === "string" ? data.startTime : "";
    const clinical = data.clinical as Record<string, unknown> | undefined;
    const needsStrip = data.clinical !== undefined;
    const needsRecord = hasClinicalData(clinical);
    const needsMillis = typeof data.sessionStartMillis !== "number" && date && startTime;

    if (!needsStrip && !needsRecord && !needsMillis) continue;
    if (needsRecord) withClinical += 1;

    const appointmentPatch: Record<string, unknown> = {};
    if (needsStrip) appointmentPatch.clinical = FieldValue.delete();
    if (needsMillis) appointmentPatch.sessionStartMillis = sessionStartMillis(date, startTime);

    if (needsRecord && ownerUid && patientId) {
      const recordRef = db.collection("clinicalRecords").doc(docSnap.id);
      if (execute) {
        batch.set(
          recordRef,
          {
            ownerUid,
            patientId,
            appointmentId: docSnap.id,
            clinical,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        batchCount += 1;
      }
      migrated += 1;
    } else if (needsStrip && !needsRecord) {
      strippedOnly += 1;
    }

    if (Object.keys(appointmentPatch).length > 0) {
      if (execute) {
        batch.update(docSnap.ref, appointmentPatch);
        batchCount += 1;
      }
    }

    if (batchCount >= 400) await flush();
  }

  await flush();

  console.log(
    JSON.stringify(
      {
        mode: execute ? "execute" : "dry-run",
        appointmentsScanned: snapshot.size,
        withClinicalData: withClinical,
        clinicalRecordsWritten: execute ? migrated : `(dry-run) ${migrated}`,
        appointmentsStrippedOnly: strippedOnly,
      },
      null,
      2
    )
  );

  if (!execute) {
    console.log("\nNenhuma alteração gravada. Passe --execute para aplicar.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
