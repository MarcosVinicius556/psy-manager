/**
 * Cifra prontuários existentes (clinicalRecords) via envelope AES.
 * Uso: npx tsx scripts/migrate-clinical-encryption.ts [--execute]
 * Requer GOOGLE_APPLICATION_CREDENTIALS e CLINICAL_FIELD_ENC_KEY.
 * NÃO execute em produção sem revisão e dry-run.
 */
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { clinicalFieldEncryptionConfigured, encryptClinicalRecord } from "../src/lib/server/clinical-field-encryption";
import { emptyClinical } from "../src/lib/admin/types";

const execute = process.argv.includes("--execute");

async function main() {
  if (!clinicalFieldEncryptionConfigured()) {
    console.error(JSON.stringify({ error: "CLINICAL_FIELD_ENC_KEY ausente" }));
    process.exit(1);
  }
  initializeApp({ credential: applicationDefault() });
  const db = getFirestore();
  const snapshot = await db.collection("clinicalRecords").limit(500).get();
  let scanned = 0;
  let encrypted = 0;
  let skipped = 0;

  for (const docSnap of snapshot.docs) {
    scanned += 1;
    const data = docSnap.data();
    if (data.enc) {
      skipped += 1;
      continue;
    }
    const ownerUid = typeof data.ownerUid === "string" ? data.ownerUid : "";
    if (!ownerUid) {
      skipped += 1;
      continue;
    }
    const clinical = (data.clinical as ReturnType<typeof emptyClinical>) || emptyClinical();
    const { enc } = await encryptClinicalRecord(db, ownerUid, clinical);
    if (!enc) {
      skipped += 1;
      continue;
    }
    if (execute) {
      await docSnap.ref.set(
        {
          enc,
          clinical: null,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
    encrypted += 1;
  }

  console.log(
    JSON.stringify({
      mode: execute ? "execute" : "dry-run",
      scanned,
      encrypted,
      skipped,
    })
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
