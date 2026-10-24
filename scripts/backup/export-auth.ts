/**
 * Exporta usuários do Firebase Auth (inclui hash/salt quando a conta de serviço permitir).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth, type UserRecord } from "firebase-admin/auth";

export type AuthExportPayload = {
  exportedAt: string;
  userCount: number;
  users: UserRecord[];
  hashConfigTemplate: {
    algorithm: "SCRYPT";
    key: string;
    saltSeparator: string;
    rounds: number;
    memoryCost: number;
    note: string;
  };
};

function initAdmin(projectId?: string) {
  if (getApps().length > 0) {
    return getAuth();
  }

  const json = process.env.FIREBASE_BACKUP_SERVICE_ACCOUNT;
  if (json) {
    const sa = JSON.parse(json) as ServiceAccount;
    const resolvedProject = projectId || (sa as { project_id?: string }).project_id;
    initializeApp({
      credential: cert(sa),
      projectId: resolvedProject,
    });
    return getAuth();
  }

  if (projectId) {
    initializeApp({ projectId });
  } else {
    initializeApp();
  }
  return getAuth();
}

export async function exportAuthUsers(options: {
  outDir: string;
  projectId?: string;
}): Promise<{ userCount: number; outFile: string; hashConfigFile: string }> {
  const auth = initAdmin(options.projectId);
  await mkdir(options.outDir, { recursive: true });

  const users: UserRecord[] = [];
  let nextPageToken: string | undefined;

  do {
    const result = await auth.listUsers(1000, nextPageToken);
    users.push(...result.users);
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  const payload: AuthExportPayload = {
    exportedAt: new Date().toISOString(),
    userCount: users.length,
    users,
    hashConfigTemplate: {
      algorithm: "SCRYPT",
      key: "",
      saltSeparator: "",
      rounds: 8,
      memoryCost: 14,
      note:
        "Preencha key e saltSeparator com os valores de Authentication → Configurações → " +
        "Parâmetros de hash de senha no console Firebase. Não versione esses valores.",
    },
  };

  const outFile = path.join(options.outDir, "auth-users.json");
  await writeFile(outFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  const hashConfigFile = path.join(options.outDir, "auth-hash-config.json");
  await writeFile(
    hashConfigFile,
    `${JSON.stringify(
      {
        algorithm: payload.hashConfigTemplate.algorithm,
        key: payload.hashConfigTemplate.key,
        saltSeparator: payload.hashConfigTemplate.saltSeparator,
        rounds: payload.hashConfigTemplate.rounds,
        memoryCost: payload.hashConfigTemplate.memoryCost,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(`[backup] Auth: ${users.length} usuário(s) exportado(s)`);

  return { userCount: users.length, outFile, hashConfigFile };
}

async function main() {
  let outDir = path.join(process.cwd(), "backup-staging", "auth");
  let projectId = process.env.FIREBASE_PROJECT_ID;

  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === "--out" && process.argv[i + 1]) {
      outDir = path.resolve(process.argv[++i]);
    } else if (process.argv[i] === "--project" && process.argv[i + 1]) {
      projectId = process.argv[++i];
    }
  }

  await exportAuthUsers({ outDir, projectId });
}

const isMain =
  process.argv[1]?.includes("export-auth") || process.argv[1]?.endsWith("export-auth.ts");

if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
