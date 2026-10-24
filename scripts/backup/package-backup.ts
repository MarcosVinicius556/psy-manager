/**
 * Empacota staging (Firestore + Auth) em tar.gz, gera manifest e criptografa com age.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

export type BackupManifest = {
  version: 1;
  createdAt: string;
  gitSha: string;
  sourceProjectId: string;
  firestore: {
    documentCount: number;
    collectionCount: number;
    totalReads: number;
  };
  auth: {
    userCount: number;
  };
  archive: {
    tarGzFileName: string;
    sha256: string;
    encryptedFileName: string;
  };
};

function resolveGitSha(): string {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

async function sha256File(filePath: string): Promise<string> {
  const data = await readFile(filePath);
  return createHash("sha256").update(data).digest("hex");
}

export async function packageAndEncrypt(options: {
  stagingDir: string;
  outputDir: string;
  projectId: string;
  firestoreStats: {
    documentCount: number;
    collectionCount: number;
    totalReads: number;
  };
  authUserCount: number;
  ageRecipient?: string;
  passphraseEnvVar?: string;
}): Promise<{ manifest: BackupManifest; encryptedPath: string }> {
  const createdAt = new Date().toISOString();
  const stamp = createdAt.replace(/[:.]/g, "-");
  const tarBase = `psy-manager-backup-${stamp}`;
  const tarGzFileName = `${tarBase}.tar.gz`;
  const encryptedFileName = `${tarGzFileName}.age`;

  await mkdir(options.outputDir, { recursive: true });
  const tarPath = path.join(options.outputDir, tarGzFileName);
  const encryptedPath = path.join(options.outputDir, encryptedFileName);

  const tarResult = spawnSync("tar", ["-czf", tarPath, "-C", options.stagingDir, "."], {
    stdio: "pipe",
  });
  if (tarResult.status !== 0) {
    throw new Error(`tar falhou: ${tarResult.stderr?.toString() || "erro desconhecido"}`);
  }

  const sha256 = await sha256File(tarPath);

  const manifest: BackupManifest = {
    version: 1,
    createdAt,
    gitSha: resolveGitSha(),
    sourceProjectId: options.projectId,
    firestore: {
      documentCount: options.firestoreStats.documentCount,
      collectionCount: options.firestoreStats.collectionCount,
      totalReads: options.firestoreStats.totalReads,
    },
    auth: { userCount: options.authUserCount },
    archive: {
      tarGzFileName,
      sha256,
      encryptedFileName,
    },
  };

  await writeFile(
    path.join(options.stagingDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  // Re-pack with manifest inside the archive
  const tarWithManifest = spawnSync("tar", ["-czf", tarPath, "-C", options.stagingDir, "."], {
    stdio: "pipe",
  });
  if (tarWithManifest.status !== 0) {
    throw new Error(`tar (com manifest) falhou: ${tarWithManifest.stderr?.toString()}`);
  }
  manifest.archive.sha256 = await sha256File(tarPath);
  await writeFile(
    path.join(options.outputDir, `${tarBase}.manifest.json`),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  const recipient = options.ageRecipient?.trim();
  const passphrase = options.passphraseEnvVar
    ? process.env[options.passphraseEnvVar]
    : undefined;

  if (recipient) {
    const age = spawnSync("age", ["-r", recipient, "-o", encryptedPath, tarPath], {
      stdio: "pipe",
    });
    if (age.status !== 0) {
      throw new Error(`age (recipient) falhou: ${age.stderr?.toString()}`);
    }
  } else if (passphrase) {
    const age = spawnSync("age", ["-p", "-o", encryptedPath, tarPath], {
      stdio: "pipe",
      input: `${passphrase}\n`,
    });
    if (age.status !== 0) {
      throw new Error(`age (passphrase) falhou: ${age.stderr?.toString()}`);
    }
  } else {
    throw new Error("Defina BACKUP_AGE_RECIPIENT ou BACKUP_PASSPHRASE para criptografar o backup");
  }

  await rm(tarPath, { force: true });

  return { manifest, encryptedPath };
}

export async function wipeStaging(stagingDir: string) {
  const entries = await readdir(stagingDir).catch(() => []);
  for (const entry of entries) {
    await rm(path.join(stagingDir, entry), { recursive: true, force: true });
  }
}
