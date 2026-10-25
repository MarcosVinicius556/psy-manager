import { getAdminDb } from "@/lib/firebase-admin";
import { decryptSecret, encryptSecret } from "./encryption";
import type { EmailIntegrationPrivate, EmailIntegrationPublic, EmailProvider } from "./types";
import { emailIntegrationAvailable } from "./config";

const COLLECTION = "emailIntegrations";

function docRef(uid: string) {
  const db = getAdminDb();
  if (!db) return null;
  return db.collection(COLLECTION).doc(uid);
}

export function toPublicIntegration(record: EmailIntegrationPrivate | null): EmailIntegrationPublic {
  const available = emailIntegrationAvailable();
  if (!record?.provider || !record.connectedAddress) {
    return { provider: null, connectedAddress: null, connectedAt: null, available };
  }
  return {
    provider: record.provider,
    connectedAddress: record.connectedAddress,
    connectedAt: record.connectedAt || null,
    available,
  };
}

export async function readEmailIntegration(uid: string) {
  const ref = docRef(uid);
  if (!ref) return null;
  const snap = await ref.get();
  if (!snap.exists) return null;
  return snap.data() as EmailIntegrationPrivate;
}

export async function writeEmailIntegration(uid: string, data: Partial<EmailIntegrationPrivate>) {
  const ref = docRef(uid);
  if (!ref) throw new Error("firebase_admin_indisponivel");
  await ref.set(data, { merge: true });
}

export async function deleteEmailIntegration(uid: string) {
  const ref = docRef(uid);
  if (!ref) throw new Error("firebase_admin_indisponivel");
  await ref.delete();
}

export function encryptCredential(plain: string) {
  return encryptSecret(plain);
}

export function decryptCredential(encrypted: string) {
  return decryptSecret(encrypted);
}

export async function saveOAuthPendingNonce(uid: string, nonce: string) {
  await writeEmailIntegration(uid, { oauthStateNonce: nonce });
}

export async function consumeOAuthNonce(uid: string, nonce: string) {
  const record = await readEmailIntegration(uid);
  if (!record?.oauthStateNonce || record.oauthStateNonce !== nonce) return false;
  await writeEmailIntegration(uid, { oauthStateNonce: "" });
  return true;
}

export async function markConnected(
  uid: string,
  provider: EmailProvider,
  connectedAddress: string,
  secrets: { refreshTokenEncrypted?: string; smtpPasswordEncrypted?: string }
) {
  const patch: Partial<EmailIntegrationPrivate> = {
    provider,
    connectedAddress: connectedAddress.toLowerCase(),
    connectedAt: new Date().toISOString(),
    accessTokenEncrypted: undefined,
    accessTokenExpiresAt: undefined,
    oauthStateNonce: "",
  };
  if (provider === "gmail_oauth") {
    patch.refreshTokenEncrypted = secrets.refreshTokenEncrypted;
    patch.smtpPasswordEncrypted = undefined;
  } else if (provider === "gmail_smtp") {
    patch.smtpPasswordEncrypted = secrets.smtpPasswordEncrypted;
    patch.refreshTokenEncrypted = undefined;
  }
  await writeEmailIntegration(uid, patch);
}
