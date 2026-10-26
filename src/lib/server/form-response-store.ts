import type { Firestore } from "firebase-admin/firestore";
import { clinicalFieldEncryptionConfigured, type ClinicalEncBlob } from "./clinical-field-encryption";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;

function masterKey() {
  const raw = process.env.CLINICAL_FIELD_ENC_KEY?.trim();
  if (!raw) return null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  const buf = Buffer.from(raw, "base64");
  if (buf.length === 32) return buf;
  return createHash("sha256").update(raw, "utf8").digest();
}

function encryptJson(plain: Record<string, string>) {
  const key = masterKey();
  if (!key) return { plain, enc: null as ClinicalEncBlob | null };
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const payload = Buffer.concat([cipher.update(JSON.stringify(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    plain: null,
    enc: {
      v: 1,
      iv: iv.toString("base64url"),
      tag: tag.toString("base64url"),
      data: payload.toString("base64url"),
    } satisfies ClinicalEncBlob,
  };
}

function decryptJson(enc: ClinicalEncBlob): Record<string, string> {
  const key = masterKey();
  if (!key) return {};
  const decipher = createDecipheriv(ALGO, key, Buffer.from(enc.iv, "base64url"));
  decipher.setAuthTag(Buffer.from(enc.tag, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(enc.data, "base64url")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8")) as Record<string, string>;
}

export async function encryptFormResponses(db: Firestore, ownerUid: string, respostas: Record<string, string>) {
  void db;
  void ownerUid;
  return encryptJson(respostas);
}

export function decryptFormResponses(data: { respostas?: unknown; enc?: unknown }) {
  const enc = data.enc as ClinicalEncBlob | undefined;
  if (enc && enc.iv && enc.tag && enc.data && clinicalFieldEncryptionConfigured()) {
    try {
      return decryptJson(enc);
    } catch (error) {
      console.error("form response decrypt:", error);
      return {};
    }
  }
  if (data.respostas && typeof data.respostas === "object") {
    return data.respostas as Record<string, string>;
  }
  return {};
}
