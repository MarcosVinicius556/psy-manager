import { randomBytes } from "node:crypto";
import { getAdminDb } from "@/lib/firebase-admin";
import type { SupervisionCasePayload } from "@/lib/team/types";

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function token() {
  return randomBytes(24).toString("hex");
}

export async function createSupervisionShare(input: {
  ownerUid: string;
  patientId: string;
  createdByUid: string;
  payload: SupervisionCasePayload;
  ttlMs?: number;
}) {
  const db = getAdminDb();
  if (!db) return null;
  const docToken = token();
  const now = Date.now();
  const expiresAtMillis = now + (input.ttlMs ?? DEFAULT_TTL_MS);
  await db.collection("supervisionShares").doc(docToken).set({
    token: docToken,
    ownerUid: input.ownerUid,
    patientId: input.patientId,
    createdByUid: input.createdByUid,
    createdAt: new Date(now).toISOString(),
    expiresAtMillis,
    reviewerConfirmed: true,
    payload: input.payload,
  });
  await db.collection("supervisionExportLog").add({
    ownerUid: input.ownerUid,
    patientId: input.patientId,
    token: docToken,
    createdAt: new Date().toISOString(),
    createdByUid: input.createdByUid,
    expiresAtMillis,
  });
  return { token: docToken, expiresAtMillis };
}

export async function readSupervisionShare(docToken: string) {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db.collection("supervisionShares").doc(docToken).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  if (typeof data.expiresAtMillis !== "number" || data.expiresAtMillis <= Date.now()) return null;
  return data;
}
