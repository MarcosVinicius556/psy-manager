/**
 * Exporta Firestore (coleções e subcoleções) para NDJSON com orçamento de leituras.
 *
 * Uso:
 *   GOOGLE_APPLICATION_CREDENTIALS=... tsx scripts/backup/export-firestore.ts --out ./backup-staging/firestore
 */
import { createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import {
  collectionPathKey,
  collectionRefFromPath,
  type ExportedDocument,
  serializeFirestoreValue,
} from "./serde";

const DEFAULT_READ_BUDGET = 40_000;
const PAGE_SIZE = 500;

export type ExportStats = {
  collectionPaths: string[];
  documentCount: number;
  totalReads: number;
  readBudget: number;
};

function parseArgs(argv: string[]) {
  let outDir = path.join(process.cwd(), "backup-staging", "firestore");
  let readBudget = DEFAULT_READ_BUDGET;
  let projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--out" && argv[i + 1]) {
      outDir = path.resolve(argv[++i]);
    } else if (arg === "--read-budget" && argv[i + 1]) {
      readBudget = Number.parseInt(argv[++i], 10);
    } else if (arg === "--project" && argv[i + 1]) {
      projectId = argv[++i];
    }
  }

  if (!Number.isFinite(readBudget) || readBudget <= 0) {
    throw new Error("--read-budget deve ser um inteiro positivo");
  }

  return { outDir, readBudget, projectId };
}

function initAdmin(projectId?: string) {
  if (getApps().length > 0) {
    return getFirestore();
  }

  const json = process.env.FIREBASE_BACKUP_SERVICE_ACCOUNT;
  if (json) {
    const sa = JSON.parse(json) as ServiceAccount;
    const resolvedProject = projectId || (sa as { project_id?: string }).project_id;
    initializeApp({
      credential: cert(sa),
      projectId: resolvedProject,
    });
    return getFirestore();
  }

  if (projectId) {
    initializeApp({ projectId });
  } else {
    initializeApp();
  }
  return getFirestore();
}

export class ReadBudgetError extends Error {
  constructor(
    message: string,
    readonly stats: ExportStats,
  ) {
    super(message);
    this.name = "ReadBudgetError";
  }
}

function chargeReads(stats: ExportStats, reads: number) {
  stats.totalReads += reads;
  if (stats.totalReads > stats.readBudget) {
    throw new ReadBudgetError(
      `Orçamento de leituras excedido: ${stats.totalReads} > ${stats.readBudget}. ` +
        `Abortando para proteger a cota diária do Spark (50k/dia). ` +
        `Aumente --read-budget apenas se tiver certeza da cota disponível.`,
      stats,
    );
  }
}

async function enqueueSubcollections(
  db: Firestore,
  documentPath: string,
  queue: string[],
  seen: Set<string>,
) {
  const subcollections = await db.doc(documentPath).listCollections();
  for (const sub of subcollections) {
    if (!seen.has(sub.path)) {
      seen.add(sub.path);
      queue.push(sub.path);
    }
  }
}

async function exportCollectionSinglePass(
  db: Firestore,
  collectionPath: string,
  outDir: string,
  stats: ExportStats,
  queue: string[],
  seen: Set<string>,
): Promise<number> {
  const collectionRef = collectionRefFromPath(db, collectionPath);
  const fileName = `${collectionPathKey(collectionPath)}.ndjson`;
  const filePath = path.join(outDir, fileName);
  await mkdir(outDir, { recursive: true });

  const stream = createWriteStream(filePath, { encoding: "utf8" });
  let documentCount = 0;
  let lastDoc: QueryDocumentSnapshot | undefined;

  const handlePage = async (docs: QueryDocumentSnapshot[]) => {
    for (const doc of docs) {
      const payload: ExportedDocument = {
        path: doc.ref.path,
        data: serializeFirestoreValue(doc.data()) as Record<string, unknown>,
      };
      stream.write(`${JSON.stringify(payload)}\n`);
      documentCount += 1;
      await enqueueSubcollections(db, doc.ref.path, queue, seen);
    }
  };

  const first = await collectionRef.orderBy("__name__").limit(PAGE_SIZE).get();
  chargeReads(stats, first.size);
  await handlePage(first.docs);
  lastDoc = first.docs[first.docs.length - 1];

  while (lastDoc) {
    const page = await collectionRef
      .orderBy("__name__")
      .startAfter(lastDoc)
      .limit(PAGE_SIZE)
      .get();
    chargeReads(stats, page.size);
    if (page.empty) {
      break;
    }
    await handlePage(page.docs);
    lastDoc = page.docs[page.docs.length - 1];
  }

  await new Promise<void>((resolve, reject) => {
    stream.end(() => resolve());
    stream.on("error", reject);
  });

  if (documentCount === 0) {
    const { unlink } = await import("node:fs/promises");
    await unlink(filePath).catch(() => undefined);
  }

  console.log(
    `[backup] coleção ${collectionPath}: ${documentCount} documento(s); leituras acumuladas: ${stats.totalReads}`,
  );

  return documentCount;
}

export async function exportFirestore(options: {
  outDir: string;
  readBudget?: number;
  projectId?: string;
}): Promise<ExportStats> {
  const readBudget = options.readBudget ?? DEFAULT_READ_BUDGET;
  const db = initAdmin(options.projectId);
  const stats: ExportStats = {
    collectionPaths: [],
    documentCount: 0,
    totalReads: 0,
    readBudget,
  };

  const seen = new Set<string>();
  const queue: string[] = [];

  for (const root of await db.listCollections()) {
    if (!seen.has(root.path)) {
      seen.add(root.path);
      queue.push(root.path);
    }
  }

  while (queue.length > 0) {
    const collectionPath = queue.shift()!;
    const count = await exportCollectionSinglePass(
      db,
      collectionPath,
      options.outDir,
      stats,
      queue,
      seen,
    );
    stats.documentCount += count;
  }

  stats.collectionPaths = [...seen].sort();

  console.log(
    `[backup] Firestore: ${stats.documentCount} documento(s) em ${stats.collectionPaths.length} coleção(ões); ` +
      `total de leituras: ${stats.totalReads} (orçamento: ${readBudget})`,
  );

  return stats;
}

async function main() {
  const { outDir, readBudget, projectId } = parseArgs(process.argv.slice(2));
  await mkdir(outDir, { recursive: true });

  try {
    const stats = await exportFirestore({ outDir, readBudget, projectId });
    const summaryPath = path.join(path.dirname(outDir), "firestore-export-summary.json");
    await writeFile(summaryPath, `${JSON.stringify(stats, null, 2)}\n`, "utf8");
  } catch (error) {
    if (error instanceof ReadBudgetError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }
}

const isMain =
  process.argv[1]?.includes("export-firestore") ||
  process.argv[1]?.endsWith("export-firestore.ts");

if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
