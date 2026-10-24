import { getAdminDb } from "@/lib/firebase-admin";
import { decryptSecret, encryptSecret } from "./encryption";
import type { GoogleCalendarEventTitleMode, GoogleCalendarIntegrationSettings, GoogleCalendarPrivateRecord } from "./types";

const COLLECTION = "integrations";

function docRef(uid: string) {
  const db = getAdminDb();
  if (!db) return null;
  return db.collection(COLLECTION).doc(uid);
}

export function toPublicSettings(record: GoogleCalendarPrivateRecord | null): GoogleCalendarIntegrationSettings {
  if (!record?.refreshTokenEncrypted) {
    return {
      enabled: false,
      googleEmail: null,
      calendarId: null,
      calendarSummary: null,
      syncToGoogle: false,
      syncFromGoogle: false,
      eventTitleMode: "generic",
      connectedAt: null,
    };
  }
  return {
    enabled: true,
    googleEmail: record.googleEmail,
    calendarId: record.calendarId,
    calendarSummary: record.calendarSummary,
    syncToGoogle: record.syncToGoogle,
    syncFromGoogle: record.syncFromGoogle,
    eventTitleMode: record.eventTitleMode,
    connectedAt: record.connectedAt,
  };
}

export async function readIntegration(uid: string) {
  const ref = docRef(uid);
  if (!ref) return null;
  const snap = await ref.get();
  if (!snap.exists) return null;
  return snap.data() as GoogleCalendarPrivateRecord;
}

export async function writeIntegration(uid: string, data: Partial<GoogleCalendarPrivateRecord>) {
  const ref = docRef(uid);
  if (!ref) throw new Error("firebase_admin_indisponivel");
  await ref.set(data, { merge: true });
}

export async function deleteIntegration(uid: string) {
  const ref = docRef(uid);
  if (!ref) throw new Error("firebase_admin_indisponivel");
  await ref.delete();
}

export function encryptRefreshToken(token: string) {
  return encryptSecret(token);
}

export function decryptRefreshToken(encrypted: string) {
  return decryptSecret(encrypted);
}

export function encryptAccessToken(token: string) {
  return encryptSecret(token);
}

export function decryptAccessToken(encrypted: string) {
  return decryptSecret(encrypted);
}

export async function saveOAuthPendingNonce(uid: string, nonce: string) {
  await writeIntegration(uid, { oauthStateNonce: nonce });
}

export async function consumeOAuthNonce(uid: string, nonce: string) {
  const record = await readIntegration(uid);
  if (!record?.oauthStateNonce || record.oauthStateNonce !== nonce) return false;
  await writeIntegration(uid, { oauthStateNonce: "" });
  return true;
}

export async function updateSettings(
  uid: string,
  patch: {
    calendarId?: string | null;
    calendarSummary?: string | null;
    syncToGoogle?: boolean;
    syncFromGoogle?: boolean;
    eventTitleMode?: GoogleCalendarEventTitleMode;
  }
) {
  await writeIntegration(uid, patch);
}
