import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/admin/firebase";

export const ACTIVATION_EVENT_NAMES = [
  "signup",
  "horarios_definidos",
  "primeiro_paciente",
  "primeira_sessao_concluida",
  "primeiro_pagamento",
  "ativo_7_dias",
] as const;

export type ActivationEventName = (typeof ACTIVATION_EVENT_NAMES)[number];

export type ActivationEventRecord = {
  id: string;
  accountId: string;
  event: ActivationEventName;
  at: string;
};

export function activationEventId(accountId: string, event: ActivationEventName) {
  return `${accountId}_${event}`;
}

export async function recordActivationEvent(accountId: string, event: ActivationEventName, at = new Date().toISOString()) {
  if (!accountId) return;
  const id = activationEventId(accountId, event);
  const ref = doc(getFirebaseDb(), "activationEvents", id);
  try {
    const existing = await getDoc(ref);
    if (existing.exists()) return;
    await setDoc(ref, { accountId, event, at });
  } catch (error) {
    console.error("activation_event", event, error);
  }
}

export async function maybeRecordAtivo7Dias(accountId: string, createdAt: string, now = Date.now()) {
  const started = Date.parse(createdAt);
  if (!Number.isFinite(started) || now - started < 7 * 24 * 60 * 60 * 1000) return;
  await recordActivationEvent(accountId, "ativo_7_dias");
}
