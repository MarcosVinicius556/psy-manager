import { getAdminDb } from "@/lib/firebase-admin";
import { decryptSecret, encryptSecret } from "./encryption";
import type { GoogleCalendarEventTitleMode, GoogleCalendarIntegrationSettings, GoogleCalendarPrivateRecord } from "./types";
import { locationIntegrationKey, userIntegrationKey } from "./integration-keys";

const COLLECTION = "integrations";

function docRef(key: string) {
  const db = getAdminDb();
  if (!db) return null;
  return db.collection(COLLECTION).doc(key);
}

function emptySettings(kind: "user" | "location" = "user", locationId: string | null = null): GoogleCalendarIntegrationSettings {
  return {
    enabled: false,
    googleEmail: null,
    calendarId: null,
    calendarSummary: null,
    syncToGoogle: false,
    syncFromGoogle: false,
    blockGoogleBusy: false,
    showGoogleEventTitles: false,
    eventTitleMode: "generic",
    connectedAt: null,
    kind,
    locationId,
  };
}

export function toPublicSettings(record: GoogleCalendarPrivateRecord | null, kind: "user" | "location" = "user", locationId: string | null = null): GoogleCalendarIntegrationSettings {
  if (!record?.refreshTokenEncrypted) {
    return emptySettings(kind, locationId);
  }
  return {
    enabled: true,
    googleEmail: record.googleEmail,
    calendarId: record.calendarId,
    calendarSummary: record.calendarSummary,
    syncToGoogle: record.syncToGoogle,
    syncFromGoogle: record.syncFromGoogle,
    blockGoogleBusy: Boolean(record.blockGoogleBusy),
    showGoogleEventTitles: Boolean(record.showGoogleEventTitles),
    eventTitleMode: record.eventTitleMode,
    connectedAt: record.connectedAt,
    kind: record.kind || kind,
    locationId: record.locationId ?? locationId,
  };
}

export async function readIntegration(key: string) {
  const ref = docRef(key);
  if (!ref) return null;
  const snap = await ref.get();
  if (!snap.exists) return null;
  return snap.data() as GoogleCalendarPrivateRecord;
}

export async function readUserIntegration(uid: string) {
  return readIntegration(userIntegrationKey(uid));
}

export async function readLocationIntegration(locationId: string) {
  return readIntegration(locationIntegrationKey(locationId));
}

export async function writeIntegration(key: string, data: Partial<GoogleCalendarPrivateRecord>) {
  const ref = docRef(key);
  if (!ref) throw new Error("firebase_admin_indisponivel");
  await ref.set(data, { merge: true });
}

export async function deleteIntegration(key: string) {
  const ref = docRef(key);
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

export async function saveOAuthPendingNonce(key: string, nonce: string) {
  await writeIntegration(key, { oauthStateNonce: nonce });
}

export async function consumeOAuthNonce(key: string, nonce: string) {
  const record = await readIntegration(key);
  if (!record?.oauthStateNonce || record.oauthStateNonce !== nonce) return false;
  await writeIntegration(key, { oauthStateNonce: "" });
  return true;
}

export async function updateSettings(
  key: string,
  patch: {
    calendarId?: string | null;
    calendarSummary?: string | null;
    syncToGoogle?: boolean;
    syncFromGoogle?: boolean;
    blockGoogleBusy?: boolean;
    showGoogleEventTitles?: boolean;
    eventTitleMode?: GoogleCalendarEventTitleMode;
  }
) {
  await writeIntegration(key, patch);
}
