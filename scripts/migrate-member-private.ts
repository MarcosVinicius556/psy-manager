/**
 * Move CPF/CRP/endereço profissional de `members` para `memberPrivate/{uid}`.
 *
 * Uso (dry-run por padrão):
 *   GOOGLE_APPLICATION_CREDENTIALS=... npx tsx scripts/migrate-member-private.ts
 *   GOOGLE_APPLICATION_CREDENTIALS=... npx tsx scripts/migrate-member-private.ts --execute
 */
import { FieldValue } from "firebase-admin/firestore";
import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const PRIVATE_KEYS = [
  "cpf",
  "crpNumero",
  "crpRegiao",
  "enderecoLogradouro",
  "enderecoCidade",
  "enderecoUf",
  "enderecoCep",
] as const;

function hasPrivateData(data: Record<string, unknown>) {
  return PRIVATE_KEYS.some((key) => {
    const value = data[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

async function main() {
  const execute = process.argv.includes("--execute");
  if (!getApps().length) {
    initializeApp({ credential: applicationDefault() });
  }
  const db = getFirestore();
  const snapshot = await db.collection("members").get();
  let candidates = 0;
  let migrated = 0;
  let batch = db.batch();
  let batchCount = 0;

  const flush = async () => {
    if (!execute || batchCount === 0) return;
    await batch.commit();
    batch = db.batch();
    batchCount = 0;
  };

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as Record<string, unknown>;
    const uid = typeof data.uid === "string" ? data.uid : "";
    const ownerUid = typeof data.ownerUid === "string" ? data.ownerUid : "";
    if (!uid || uid !== ownerUid) continue;
    if (!hasPrivateData(data) && !PRIVATE_KEYS.some((key) => key in data)) continue;
    candidates += 1;

    const privatePayload: Record<string, unknown> = { ownerUid: uid, updatedAt: new Date().toISOString() };
    for (const key of PRIVATE_KEYS) {
      if (typeof data[key] === "string") privatePayload[key] = data[key];
    }

    const memberPatch: Record<string, unknown> = {};
    for (const key of PRIVATE_KEYS) {
      if (key in data) memberPatch[key] = FieldValue.delete();
    }

    if (execute) {
      batch.set(db.collection("memberPrivate").doc(uid), privatePayload, { merge: true });
      batchCount += 1;
      if (Object.keys(memberPatch).length > 0) {
        batch.update(docSnap.ref, memberPatch);
        batchCount += 1;
      }
    }
    migrated += 1;
    if (batchCount >= 400) await flush();
  }

  await flush();

  console.log(
    JSON.stringify(
      {
        mode: execute ? "execute" : "dry-run",
        membersScanned: snapshot.size,
        canonicalWithPrivateFields: candidates,
        migrated: execute ? migrated : `(dry-run) ${migrated}`,
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
