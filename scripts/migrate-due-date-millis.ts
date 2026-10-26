/**
 * Preenche `dueDateMillis` em `payments` a partir de `dueDate`.
 *
 * Uso (dry-run por padrão):
 *   GOOGLE_APPLICATION_CREDENTIALS=... npx tsx scripts/migrate-due-date-millis.ts
 *   GOOGLE_APPLICATION_CREDENTIALS=... npx tsx scripts/migrate-due-date-millis.ts --execute
 */
import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { dueDateMillis } from "../src/lib/admin/due-date-millis";

async function main() {
  const execute = process.argv.includes("--execute");
  if (!getApps().length) {
    initializeApp({ credential: applicationDefault() });
  }
  const db = getFirestore();
  const snapshot = await db.collection("payments").get();
  let touched = 0;
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
    if (typeof data.dueDateMillis === "number" && data.dueDateMillis > 0) continue;
    const dueDate = typeof data.dueDate === "string" ? data.dueDate : "";
    const millis = dueDateMillis(dueDate);
    if (!millis) continue;
    touched += 1;
    if (execute) {
      batch.update(docSnap.ref, { dueDateMillis: millis });
      batchCount += 1;
      if (batchCount >= 400) await flush();
    }
  }
  await flush();
  console.log(execute ? `Atualizados ${touched} pagamentos.` : `Dry-run: ${touched} pagamentos precisariam de dueDateMillis.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
