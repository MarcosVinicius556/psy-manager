import { createHash, randomBytes } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";

export const LINK_CODE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeLinkCodeInput(raw: string) {
  return raw.replace(/[\s-]/g, "").toUpperCase();
}

export function formatLinkCode(raw: string) {
  const n = normalizeLinkCodeInput(raw);
  if (n.length <= 4) return n;
  return `${n.slice(0, 4)}-${n.slice(4)}`;
}

export function hashLinkCode(code: string) {
  return createHash("sha256").update(normalizeLinkCodeInput(code)).digest("hex");
}

export function generateLinkCodePlain() {
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i += 1) {
    out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return out;
}

export type PatientLinkCodeStatus = "pendente" | "vinculado" | "revogado";

export type PatientLinkCodeDoc = {
  codeHash: string;
  ownerUid: string;
  patientId: string;
  status: PatientLinkCodeStatus;
  createdAt: string;
  expiresAt: string;
  expiresAtMillis: number;
  usedAt: string | null;
  usedByUid: string | null;
  revokedAt: string | null;
};

export async function createPatientLinkCode(db: Firestore, ownerUid: string, patientId: string) {
  const plain = generateLinkCodePlain();
  const codeHash = hashLinkCode(plain);
  const now = Date.now();
  const createdAt = new Date(now).toISOString();
  const expiresAtMillis = now + LINK_CODE_TTL_MS;
  const expiresAt = new Date(expiresAtMillis).toISOString();

  const pendingSnap = await db.collection("patientLinkCodes").where("ownerUid", "==", ownerUid).limit(50).get();
  const pending = pendingSnap.docs.filter(
    (doc) => doc.data().patientId === patientId && doc.data().status === "pendente"
  );

  await Promise.all(
    pending.map((doc) =>
      doc.ref.set({ status: "revogado", revokedAt: createdAt, updatedAt: createdAt }, { merge: true })
    )
  );

  const ref = db.collection("patientLinkCodes").doc(codeHash);
  await ref.set({
    codeHash,
    ownerUid,
    patientId,
    status: "pendente",
    createdAt,
    expiresAt,
    expiresAtMillis,
    usedAt: null,
    usedByUid: null,
    revokedAt: null,
  });

  return {
    code: formatLinkCode(plain),
    codePlain: plain,
    expiresAt,
    linkPath: `/paciente/conexoes?codigo=${encodeURIComponent(formatLinkCode(plain))}`,
  };
}

export async function revokePendingLinkCodes(db: Firestore, ownerUid: string, patientId: string) {
  const snap = await db.collection("patientLinkCodes").where("ownerUid", "==", ownerUid).limit(50).get();
  const pending = snap.docs.filter(
    (doc) => doc.data().patientId === patientId && doc.data().status === "pendente"
  );
  const now = new Date().toISOString();
  await Promise.all(
    pending.map((doc) => doc.ref.set({ status: "revogado", revokedAt: now, updatedAt: now }, { merge: true }))
  );
}

export async function findLatestPendingLinkCodeMeta(db: Firestore, ownerUid: string, patientId: string) {
  const snap = await db.collection("patientLinkCodes").where("ownerUid", "==", ownerUid).limit(50).get();
  const pending = snap.docs
    .map((doc) => doc.data())
    .filter((data) => data.patientId === patientId && data.status === "pendente")
    .sort((a, b) => Number(b.expiresAtMillis) - Number(a.expiresAtMillis));
  const doc = pending[0];
  if (!doc) return null;
  return doc;
}

export async function loadLinkCodeByInput(db: Firestore, codeInput: string) {
  const codeHash = hashLinkCode(codeInput);
  const snap = await db.collection("patientLinkCodes").doc(codeHash).get();
  if (!snap.exists) return null;
  return { ref: snap.ref, data: snap.data() as PatientLinkCodeDoc };
}

export async function appendLinkCodeAudit(
  db: Firestore,
  entry: {
    action: string;
    patientUid?: string;
    ownerUid?: string;
    patientId?: string;
    ip?: string;
    success: boolean;
  }
) {
  const id = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  await db.collection("patientLinkCodeAudit").doc(id).set({
    ...entry,
    createdAt: new Date().toISOString(),
  });
}
