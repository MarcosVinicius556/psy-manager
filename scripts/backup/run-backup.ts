/**
 * Orquestra export Firestore + Auth, empacota e criptografa (uso no CI e local).
 */
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { exportFirestore } from "./export-firestore";
import { exportAuthUsers } from "./export-auth";
import { packageAndEncrypt, wipeStaging } from "./package-backup";

const DEFAULT_PROJECT = "clinic-manager-ed887";

async function main() {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    DEFAULT_PROJECT;

  const readBudget = process.env.BACKUP_READ_BUDGET
    ? Number.parseInt(process.env.BACKUP_READ_BUDGET, 10)
    : undefined;

  const workRoot = path.join(process.cwd(), ".backup-work");
  const stagingDir = path.join(workRoot, "staging");
  const outputDir = path.join(workRoot, "out");
  const firestoreDir = path.join(stagingDir, "firestore");
  const authDir = path.join(stagingDir, "auth");

  await rm(workRoot, { recursive: true, force: true });
  await mkdir(firestoreDir, { recursive: true });
  await mkdir(authDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  const firestoreStats = await exportFirestore({
    outDir: firestoreDir,
    readBudget,
    projectId,
  });

  const authStats = await exportAuthUsers({ outDir: authDir, projectId });

  const { manifest, encryptedPath } = await packageAndEncrypt({
    stagingDir,
    outputDir,
    projectId,
    firestoreStats: {
      documentCount: firestoreStats.documentCount,
      collectionCount: firestoreStats.collectionPaths.length,
      totalReads: firestoreStats.totalReads,
    },
    authUserCount: authStats.userCount,
    ageRecipient: process.env.BACKUP_AGE_RECIPIENT,
    passphraseEnvVar: "BACKUP_PASSPHRASE",
  });

  console.log(
    `[backup] Arquivo criptografado: ${encryptedPath} (sha256 do tar: ${manifest.archive.sha256})`,
  );

  await wipeStaging(stagingDir);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
