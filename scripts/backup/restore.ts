/**
 * Restaura backup criptografado (age) em um projeto Firebase de destino.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth, type UserImportRecord } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import type { AuthExportPayload } from "./export-auth";
import type { BackupManifest } from "./package-backup";
import { collectionPathKey, collectionRefFromPath, deserializeFirestoreValue } from "./serde";
import type { ExportedDocument } from "./serde";

const PRODUCTION_PROJECT = "clinic-manager-ed887";

type RestoreOptions = {
  archivePath: string;
  projectId: string;
  dryRun: boolean;
  allowProduction: boolean;
  onlyCollection?: string;
  ageIdentityPath?: string;
  passphrase?: string;
  skipAuth?: boolean;
};

function parseArgs(argv: string[]): RestoreOptions {
  let archivePath = "";
  let projectId = "";
  let dryRun = false;
  let allowProduction = false;
  let onlyCollection: string | undefined;
  let ageIdentityPath = process.env.BACKUP_AGE_IDENTITY;
  let passphrase = process.env.BACKUP_PASSPHRASE;
  let skipAuth = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--archive" && argv[i + 1]) {
      archivePath = path.resolve(argv[++i]);
    } else if (arg === "--project" && argv[i + 1]) {
      projectId = argv[++i];
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--i-know-this-is-production") {
      allowProduction = true;
    } else if (arg === "--collection" && argv[i + 1]) {
      onlyCollection = argv[++i];
    } else if (arg === "--age-identity" && argv[i + 1]) {
      ageIdentityPath = path.resolve(argv[++i]);
    } else if (arg === "--passphrase" && argv[i + 1]) {
      passphrase = argv[++i];
    } else if (arg === "--skip-auth") {
      skipAuth = true;
    }
  }

  if (!archivePath) {
    throw new Error("Informe --archive com o arquivo .tar.gz.age");
  }
  if (!projectId) {
    throw new Error("Informe --project com o ID do projeto de destino");
  }

  return {
    archivePath,
    projectId,
    dryRun,
    allowProduction,
    onlyCollection,
    ageIdentityPath,
    passphrase,
    skipAuth,
  };
}

function decryptArchive(
  encryptedPath: string,
  tarPath: string,
  ageIdentityPath?: string,
  passphrase?: string,
) {
  if (ageIdentityPath) {
    const age = spawnSync("age", ["-d", "-i", ageIdentityPath, "-o", tarPath, encryptedPath], {
      stdio: "pipe",
    });
    if (age.status !== 0) {
      throw new Error(`Falha ao descriptografar com identity: ${age.stderr?.toString()}`);
    }
    return;
  }
  if (!passphrase) {
    throw new Error("Use --age-identity ou BACKUP_PASSPHRASE / --passphrase");
  }
  const age = spawnSync("age", ["-d", "-o", tarPath, encryptedPath], {
    stdio: "pipe",
    input: `${passphrase}\n`,
  });
  if (age.status !== 0) {
    throw new Error(`Falha ao descriptografar com passphrase: ${age.stderr?.toString()}`);
  }
}

async function sha256File(filePath: string): Promise<string> {
  const data = await readFile(filePath);
  return createHash("sha256").update(data).digest("hex");
}

function initTargetAdmin(projectId: string) {
  if (getApps().length === 0) {
    initializeApp({ projectId });
  }
  return { db: getFirestore(), auth: getAuth() };
}

async function readNdjson(filePath: string): Promise<ExportedDocument[]> {
  const docs: ExportedDocument[] = [];
  const rl = createInterface({ input: createReadStream(filePath, { encoding: "utf8" }) });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    docs.push(JSON.parse(trimmed) as ExportedDocument);
  }
  return docs;
}

async function restoreFirestore(
  db: Firestore,
  extractDir: string,
  options: RestoreOptions,
) {
  const firestoreDir = path.join(extractDir, "firestore");
  const entries = await readdir(firestoreDir).catch(() => []);
  const ndjsonFiles = entries.filter((f) => f.endsWith(".ndjson"));

  for (const file of ndjsonFiles.sort()) {
    const collectionKey = file.replace(/\.ndjson$/, "");
    if (
      options.onlyCollection &&
      collectionKey !== collectionPathKey(options.onlyCollection)
    ) {
      continue;
    }
    const filePath = path.join(firestoreDir, file);
    const documents = await readNdjson(filePath);
    for (const doc of documents) {
      const data = deserializeFirestoreValue(doc.data, db) as Record<string, unknown>;
      if (options.dryRun) {
        console.log(`[dry-run] set ${doc.path}`);
        continue;
      }
      await db.doc(doc.path).set(data, { merge: false });
    }
    console.log(`[restore] ${documents.length} documento(s) em ${file}`);
  }
}

async function restoreAuth(
  auth: ReturnType<typeof getAuth>,
  extractDir: string,
  options: RestoreOptions,
) {
  const authFile = path.join(extractDir, "auth", "auth-users.json");
  const hashFile = path.join(extractDir, "auth", "auth-hash-config.json");

  let payload: AuthExportPayload;
  try {
    payload = JSON.parse(await readFile(authFile, "utf8")) as AuthExportPayload;
  } catch {
    console.log("[restore] auth-users.json ausente; pulando Auth");
    return;
  }

  const hashConfigRaw = JSON.parse(await readFile(hashFile, "utf8")) as {
    algorithm: string;
    key: string;
    saltSeparator: string;
    rounds: number;
    memoryCost: number;
  };

  if (!hashConfigRaw.key || !hashConfigRaw.saltSeparator) {
    throw new Error(
      "auth-hash-config.json incompleto: preencha key e saltSeparator a partir do console Firebase",
    );
  }

  const users: UserImportRecord[] = payload.users.map((user) => {
    const record: UserImportRecord = {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
      photoURL: user.photoURL,
      disabled: user.disabled,
      providerData: user.providerData,
      customClaims: user.customClaims,
    };
    if (user.passwordHash) {
      record.passwordHash = Buffer.from(user.passwordHash, "base64");
    }
    if (user.passwordSalt) {
      record.passwordSalt = Buffer.from(user.passwordSalt, "base64");
    }
    return record;
  });

  if (options.dryRun) {
    console.log(`[dry-run] importUsers ${users.length} usuário(s)`);
    return;
  }

  const result = await auth.importUsers(users, {
    hash: {
      algorithm: "SCRYPT",
      key: Buffer.from(hashConfigRaw.key, "base64"),
      saltSeparator: Buffer.from(hashConfigRaw.saltSeparator, "base64"),
      rounds: hashConfigRaw.rounds,
      memoryCost: hashConfigRaw.memoryCost,
    },
  });

  if (result.failureCount > 0) {
    console.error(`[restore] Auth: ${result.failureCount} falha(s)`, result.errors);
    throw new Error("importUsers falhou para alguns registros");
  }
  console.log(`[restore] Auth: ${users.length} usuário(s) importado(s)`);
}

export async function restoreFromExtracted(
  extractDir: string,
  options: Pick<
    RestoreOptions,
    "projectId" | "dryRun" | "allowProduction" | "onlyCollection" | "skipAuth"
  >,
) {
  if (options.projectId === PRODUCTION_PROJECT && !options.allowProduction) {
    throw new Error(
      `Restauração no projeto de produção (${PRODUCTION_PROJECT}) bloqueada. ` +
        `Use outro --project ou passe --i-know-this-is-production se realmente for necessário.`,
    );
  }
  const { db, auth } = initTargetAdmin(options.projectId);
  await restoreFirestore(db, extractDir, {
    ...options,
    archivePath: "",
    ageIdentityPath: undefined,
    passphrase: undefined,
  });
  if (!options.skipAuth) {
    await restoreAuth(auth, extractDir, {
      ...options,
      archivePath: "",
      ageIdentityPath: undefined,
      passphrase: undefined,
      skipAuth: false,
    });
  }
}

export async function restoreBackup(options: RestoreOptions) {
  if (options.projectId === PRODUCTION_PROJECT && !options.allowProduction) {
    throw new Error(
      `Restauração no projeto de produção (${PRODUCTION_PROJECT}) bloqueada. ` +
        `Use outro --project ou passe --i-know-this-is-production se realmente for necessário.`,
    );
  }

  const workDir = path.join(process.cwd(), ".backup-restore-work");
  const tarPath = path.join(workDir, "backup.tar.gz");
  const extractDir = path.join(workDir, "extracted");

  await rm(workDir, { recursive: true, force: true });
  await mkdir(workDir, { recursive: true });
  await mkdir(extractDir, { recursive: true });

  decryptArchive(options.archivePath, tarPath, options.ageIdentityPath, options.passphrase);

  const manifestPath = options.archivePath.replace(/\.tar\.gz\.age$/, ".manifest.json");
  let expectedSha: string | undefined;
  try {
    const sidecar = JSON.parse(await readFile(manifestPath, "utf8")) as BackupManifest;
    expectedSha = sidecar.archive.sha256;
  } catch {
    const extractedManifest = path.join(extractDir, "manifest.json");
    const untarFirst = spawnSync("tar", ["-xzf", tarPath, "-C", extractDir, "manifest.json"], {
      stdio: "pipe",
    });
    if (untarFirst.status === 0) {
      const embedded = JSON.parse(await readFile(extractedManifest, "utf8")) as BackupManifest;
      expectedSha = embedded.archive.sha256;
    }
  }

  const actualSha = await sha256File(tarPath);
  if (expectedSha && expectedSha !== actualSha) {
    throw new Error(`sha256 não confere: esperado ${expectedSha}, obtido ${actualSha}`);
  }

  const untar = spawnSync("tar", ["-xzf", tarPath, "-C", extractDir], { stdio: "pipe" });
  if (untar.status !== 0) {
    throw new Error(`tar extract falhou: ${untar.stderr?.toString()}`);
  }

  const { db, auth } = initTargetAdmin(options.projectId);
  await restoreFirestore(db, extractDir, options);
  if (!options.skipAuth) {
    await restoreAuth(auth, extractDir, options);
  }

  await rm(workDir, { recursive: true, force: true });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await restoreBackup(options);
}

const isMain = process.argv[1]?.includes("restore") || process.argv[1]?.endsWith("restore.ts");

if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
