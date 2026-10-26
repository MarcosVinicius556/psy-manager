import webpush from "web-push";
import type { Firestore } from "firebase-admin/firestore";
import { isNightSilenceBrasilia } from "./brasilia-time";

export type PushPrefs = {
  agenda: boolean;
  confirmacoes: boolean;
  pagamentos: boolean;
  chamados: boolean;
  silencioNoturno: boolean;
};

export const DEFAULT_PUSH_PREFS: PushPrefs = {
  agenda: true,
  confirmacoes: true,
  pagamentos: true,
  chamados: true,
  silencioNoturno: true,
};

export function pushConfigured() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:suporte@psymanager.com.br";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || process.env.VAPID_PUBLIC_KEY?.trim() || null;
}

function ensureWebPush() {
  const cfg = pushConfigured();
  if (!cfg) return null;
  webpush.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey);
  return cfg;
}

export function normalizePushPrefs(raw: unknown): PushPrefs {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const bool = (key: keyof PushPrefs, fallback: boolean) => (data[key] === false ? false : fallback);
  return {
    agenda: bool("agenda", true),
    confirmacoes: bool("confirmacoes", true),
    pagamentos: bool("pagamentos", true),
    chamados: bool("chamados", true),
    silencioNoturno: bool("silencioNoturno", true),
  };
}

export async function sendPushToUser(
  db: Firestore,
  ownerUid: string,
  payload: { title: string; body: string; url?: string; kind: keyof PushPrefs },
  now = Date.now()
) {
  if (!ensureWebPush()) return { sent: 0, skipped: "vapid_ausente" };

  const userSnap = await db.collection("users").doc(ownerUid).get();
  const prefs = normalizePushPrefs(userSnap.data()?.pushPrefs);
  if (!prefs[payload.kind]) return { sent: 0, skipped: "pref_desligada" };
  if (prefs.silencioNoturno && isNightSilenceBrasilia(now)) return { sent: 0, skipped: "silencio_noturno" };

  const devicesSnap = await db.collection("pushTokens").doc(ownerUid).collection("devices").get();
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
          url: payload.url || "/admin/agenda",
        })
      );
      sent += 1;
      await doc.ref.set({ ultimoUso: new Date(now).toISOString() }, { merge: true });
    } catch (error) {
      const status = error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode: number }).statusCode) : 0;
      if (status === 404 || status === 410) stale.push(doc.id);
    }
  }
  if (stale.length) {
    const batch = db.batch();
    stale.forEach((id) => batch.delete(db.collection("pushTokens").doc(ownerUid).collection("devices").doc(id)));
    await batch.commit();
  }
  return { sent, removed: stale.length };
}
