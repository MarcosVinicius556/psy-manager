import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import type { Firestore } from "firebase-admin/firestore";
import type { ClinicalRecord } from "@/lib/admin/types";
import { emptyClinical } from "@/lib/admin/types";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const ENC_VERSION = 1;

export type ClinicalEncBlob = {
  v: number;
  iv: string;
  tag: string;
  data: string;
};

function masterKeyMaterial() {
  const raw = process.env.CLINICAL_FIELD_ENC_KEY?.trim();
  if (!raw) return null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  const buf = Buffer.from(raw, "base64");
  if (buf.length === 32) return buf;
  return createHash("sha256").update(raw, "utf8").digest();
}

export function clinicalFieldEncryptionConfigured() {
  return Boolean(masterKeyMaterial());
}

function wrapDek(dek: Buffer) {
  const master = masterKeyMaterial();
  if (!master) throw new Error("CLINICAL_FIELD_ENC_KEY ausente");
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, master, iv);
  const encrypted = Buffer.concat([cipher.update(dek), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function unwrapDek(payload: string) {
  const master = masterKeyMaterial();
  if (!master) throw new Error("CLINICAL_FIELD_ENC_KEY ausente");
  const [ivPart, tagPart, dataPart] = payload.split(".");
  if (!ivPart || !tagPart || !dataPart) throw new Error("Chave envelopada inválida");
  const decipher = createDecipheriv(ALGO, master, Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataPart, "base64url")), decipher.final()]);
  return decrypted;
}

async function readWrappedDek(db: Firestore, ownerUid: string) {
  const snap = await db.collection("keys").doc(ownerUid).get();
  if (!snap.exists) return null;
  const wrapped = typeof snap.data()?.wrappedKey === "string" ? snap.data()!.wrappedKey : "";
  return wrapped || null;
}

async function ensureUserDek(db: Firestore, ownerUid: string) {
  const existing = await readWrappedDek(db, ownerUid);
  if (existing) return unwrapDek(existing);
  const dek = randomBytes(32);
  const wrappedKey = wrapDek(dek);
  await db.collection("keys").doc(ownerUid).set(
    {
      ownerUid,
      wrappedKey,
      v: ENC_VERSION,
      createdAt: new Date().toISOString(),
    },
    { merge: true }
  );
  return dek;
}

function encryptWithDek(dek: Buffer, plain: string) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, dek, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: ENC_VERSION,
    iv: iv.toString("base64url"),
    tag: tag.toString("base64url"),
    data: encrypted.toString("base64url"),
  } satisfies ClinicalEncBlob;
}

function decryptWithDek(dek: Buffer, blob: ClinicalEncBlob) {
  const decipher = createDecipheriv(ALGO, dek, Buffer.from(blob.iv, "base64url"));
  decipher.setAuthTag(Buffer.from(blob.tag, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(blob.data, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export async function encryptClinicalRecord(db: Firestore, ownerUid: string, clinical: ClinicalRecord) {
  if (!clinicalFieldEncryptionConfigured()) {
    return { clinical, enc: null as ClinicalEncBlob | null };
  }
  const dek = await ensureUserDek(db, ownerUid);
  const enc = encryptWithDek(dek, JSON.stringify(clinical));
  return { clinical: null as ClinicalRecord | null, enc };
}

export async function decryptClinicalRecord(
  db: Firestore,
  ownerUid: string,
  data: { clinical?: unknown; enc?: unknown }
): Promise<ClinicalRecord> {
  const enc = data.enc as ClinicalEncBlob | undefined;
  if (enc && enc.v === ENC_VERSION && enc.iv && enc.tag && enc.data) {
    if (!clinicalFieldEncryptionConfigured()) {
      console.warn("clinical: documento cifrado mas CLINICAL_FIELD_ENC_KEY ausente; retornando vazio.");
      return emptyClinical();
    }
    try {
      const dek = await ensureUserDek(db, ownerUid);
      const json = decryptWithDek(dek, enc);
      return JSON.parse(json) as ClinicalRecord;
    } catch (error) {
      console.error("clinical: falha ao decifrar prontuário:", error);
      return emptyClinical();
    }
  }
  if (data.clinical && typeof data.clinical === "object") {
    return data.clinical as ClinicalRecord;
  }
  return emptyClinical();
}
