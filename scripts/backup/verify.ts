/**
 * Verifica export → restore em emuladores (dois project IDs no mesmo host).
 */
import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { deleteApp, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { GeoPoint, getFirestore, Timestamp } from "firebase-admin/firestore";
import { exportFirestore } from "./export-firestore";
import { exportAuthUsers } from "./export-auth";
import { packageAndEncrypt } from "./package-backup";
import { restoreBackup } from "./restore";
import { serializeFirestoreValue } from "./serde";
import type { ExportedDocument } from "./serde";

const SRC_PROJECT = "backup-verify-src";
const DST_PROJECT = "backup-verify-dst";

function assertEmulatorEnv() {
  if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error(
      "Defina FIRESTORE_EMULATOR_HOST e FIREBASE_AUTH_EMULATOR_HOST (use firebase emulators:exec)",
    );
  }
}

async function seedSource() {
  await clearAdminApps();
  initializeApp({ projectId: SRC_PROJECT });
  const db = getFirestore();
  const auth = getAuth();

  const user = await auth.createUser({
    email: "backup@test.local",
    password: "BackupTest123!",
    displayName: "Backup Test",
  });

  await db.doc(`accounts/${user.uid}`).set({
    email: "backup@test.local",
    nome: "Backup Test",
    createdAt: Timestamp.fromDate(new Date("2025-01-15T12:00:00Z")),
    geo: new GeoPoint(-27.1, -52.6),
    ref: db.doc(`accounts/${user.uid}`),
  });

  await db.doc(`accounts/${user.uid}/notes/first`).set({
    body: "nota de teste",
    tags: ["a", "b"],
  });

  await deleteApp(getApp());
}

async function clearAdminApps() {
  for (const app of getApps()) {
    await deleteApp(app);
  }
}

async function snapshotProject(projectId: string): Promise<Record<string, ExportedDocument[]>> {
  await clearAdminApps();
  initializeApp({ projectId });
  const outDir = path.join(process.cwd(), ".backup-verify", projectId);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await exportFirestore({ outDir, readBudget: 50_000, projectId });
  await deleteApp(getApp());

  const files = await readdir(outDir);
  const snapshot: Record<string, ExportedDocument[]> = {};
  for (const file of files.filter((f) => f.endsWith(".ndjson"))) {
    const raw = await readFile(path.join(outDir, file), "utf8");
    snapshot[file] = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as ExportedDocument);
  }
  return snapshot;
}

function normalizeSnapshot(snapshot: Record<string, ExportedDocument[]>) {
  const normalized: Record<string, string> = {};
  for (const [file, docs] of Object.entries(snapshot)) {
    const sorted = [...docs].sort((a, b) => a.path.localeCompare(b.path));
    normalized[file] = JSON.stringify(sorted);
  }
  return normalized;
}

function generateAgeKeyPair(workDir: string): { recipient: string; identityPath: string } {
  const identityPath = path.join(workDir, "test-age-key.txt");
  const result = spawnSync("age-keygen", ["-o", identityPath], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`age-keygen falhou: ${result.stderr || result.stdout}`);
  }
  const combined = `${result.stderr || ""}\n${result.stdout || ""}`;
  const pubLine = combined
    .split("\n")
    .find((line) => line.startsWith("Public key:") || line.startsWith("# public key:"));
  if (!pubLine) {
    throw new Error("Não foi possível ler a chave pública do age-keygen");
  }
  const recipient = pubLine.replace(/^#?\s*Public key:\s*/i, "").trim();
  return { recipient, identityPath };
}

async function main() {
  assertEmulatorEnv();
  const workDir = path.join(process.cwd(), ".backup-verify-work");
  await rm(workDir, { recursive: true, force: true });
  await mkdir(workDir, { recursive: true });

  await seedSource();
  const srcSnapshot = await snapshotProject(SRC_PROJECT);

  const stagingDir = path.join(workDir, "staging");
  const firestoreDir = path.join(stagingDir, "firestore");
  const authDir = path.join(stagingDir, "auth");
  await mkdir(firestoreDir, { recursive: true });
  await mkdir(authDir, { recursive: true });

  await clearAdminApps();
  initializeApp({ projectId: SRC_PROJECT });
  process.env.FIREBASE_PROJECT_ID = SRC_PROJECT;
  const firestoreStats = await exportFirestore({
    outDir: firestoreDir,
    readBudget: 50_000,
    projectId: SRC_PROJECT,
  });
  await exportAuthUsers({ outDir: authDir, projectId: SRC_PROJECT });
  await deleteApp(getApp());

  const { recipient, identityPath } = generateAgeKeyPair(workDir);
  const outputDir = path.join(workDir, "out");
  await mkdir(outputDir, { recursive: true });

  const { manifest, encryptedPath } = await packageAndEncrypt({
    stagingDir,
    outputDir,
    projectId: SRC_PROJECT,
    firestoreStats: {
      documentCount: firestoreStats.documentCount,
      collectionCount: firestoreStats.collectionPaths.length,
      totalReads: firestoreStats.totalReads,
    },
    authUserCount: 1,
    ageRecipient: recipient,
  });

  if (!encryptedPath.endsWith(".age")) {
    throw new Error("Arquivo criptografado inesperado");
  }

  await clearAdminApps();
  await restoreBackup({
    archivePath: encryptedPath,
    projectId: DST_PROJECT,
    dryRun: false,
    allowProduction: false,
    ageIdentityPath: identityPath,
    skipAuth: true,
  });

  const dstSnapshot = await snapshotProject(DST_PROJECT);
  const srcNorm = normalizeSnapshot(srcSnapshot);
  const dstNorm = normalizeSnapshot(dstSnapshot);

  const srcKeys = Object.keys(srcNorm).sort();
  const dstKeys = Object.keys(dstNorm).sort();
  if (srcKeys.join(",") !== dstKeys.join(",")) {
    throw new Error(`Coleções divergentes: ${srcKeys.join(",")} vs ${dstKeys.join(",")}`);
  }
  for (const key of srcKeys) {
    if (srcNorm[key] !== dstNorm[key]) {
      throw new Error(`Diff na coleção ${key}`);
    }
  }

  // serde round-trip unit check embutido
  const sample = {
    t: Timestamp.fromMillis(1_700_000_000_000),
    g: new GeoPoint(1, 2),
  };
  const round = serializeFirestoreValue(sample);
  if (JSON.stringify(round).indexOf("timestamp") < 0) {
    throw new Error("serializeFirestoreValue falhou");
  }

  console.log(
    `[backup:verify] OK — ${manifest.firestore.documentCount} docs, sha256 ${manifest.archive.sha256.slice(0, 12)}…`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
