import type { Firestore } from "firebase-admin/firestore";
import webpush from "web-push";
import { isNightSilenceBrasilia } from "@/lib/server/brasilia-time";
import { pushConfigured } from "@/lib/server/web-push";

export type PatientPushKind = "sessoes" | "documentos" | "diario" | "escalas";

export type PatientPushPrefs = {
  sessoes: boolean;
  documentos: boolean;
  diario: boolean;
  escalas: boolean;
  silencioNoturno: boolean;
};

export const DEFAULT_PATIENT_PUSH_PREFS: PatientPushPrefs = {
  sessoes: true,
  documentos: true,
  diario: true,
  escalas: true,
  silencioNoturno: true,
};

export function normalizePatientPushPrefs(raw: unknown): PatientPushPrefs {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const bool = (key: keyof PatientPushPrefs, fallback: boolean) => (data[key] === false ? false : fallback);
  return {
    sessoes: bool("sessoes", true),
    documentos: bool("documentos", true),
    diario: bool("diario", true),
    escalas: bool("escalas", true),
    silencioNoturno: bool("silencioNoturno", true),
  };
}

function ensureWebPush() {
  const cfg = pushConfigured();
  if (!cfg) return null;
  webpush.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey);
  return cfg;
}

export async function sendPatientPush(
  db: Firestore,
  patientUid: string,
  payload: { title: string; body: string; url?: string; kind: PatientPushKind },
  now = Date.now()
) {
  if (!ensureWebPush()) return { sent: 0, skipped: "vapid_ausente" };

  const userSnap = await db.collection("users").doc(patientUid).get();
  const prefs = normalizePatientPushPrefs(userSnap.data()?.pushPrefs);
  if (!prefs[payload.kind]) return { sent: 0, skipped: "pref_desligada" };
  if (prefs.silencioNoturno && isNightSilenceBrasilia(now)) return { sent: 0, skipped: "silencio_noturno" };

  const devicesSnap = await db.collection("pushTokens").doc(patientUid).collection("devices").get();
  if (devicesSnap.empty) return { sent: 0, skipped: "sem_dispositivos" };

  let sent = 0;
  const stale: string[] = [];
  for (const doc of devicesSnap.docs) {
    const data = doc.data();
    const subscription =
      data.subscription && typeof data.subscription === "object"
        ? (data.subscription as webpush.PushSubscription)
        : null;
    if (!subscription?.endpoint) {
      stale.push(doc.id);
      continue;
    }
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url || "/paciente",
        })
      );
      sent += 1;
      await doc.ref.set({ ultimoUso: new Date(now).toISOString() }, { merge: true });
    } catch (error) {
      const status =
        error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode: number }).statusCode) : 0;
      if (status === 404 || status === 410) stale.push(doc.id);
    }
  }
  if (stale.length) {
    const batch = db.batch();
    stale.forEach((id) => batch.delete(db.collection("pushTokens").doc(patientUid).collection("devices").doc(id)));
    await batch.commit();
  }
  return { sent, removed: stale.length };
}
