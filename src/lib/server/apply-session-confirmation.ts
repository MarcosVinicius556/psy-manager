import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { AppointmentConfirmationStatus } from "./session-confirmation";
import { sendPushToUser } from "./web-push";

export async function applySessionConfirmation(
  db: Firestore,
  token: string,
  nextStatus: Exclude<AppointmentConfirmationStatus, "pendente">
) {
  const ref = db.collection("sessionConfirmations").doc(token);
  const now = Date.now();
  const stamp = new Date(now).toISOString();

  let ownerUid = "";
  let startTime = "";
  let appointmentId = "";

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("missing");
    const data = snap.data() || {};
    if (data.status === "confirmada" || data.status === "remarcar") throw new Error("answered");
    const expiresAtMillis = data.expiresAtMillis;
    if (typeof expiresAtMillis === "number" && expiresAtMillis <= now) throw new Error("expired");

    ownerUid = typeof data.ownerUid === "string" ? data.ownerUid : "";
    appointmentId = typeof data.appointmentId === "string" ? data.appointmentId : "";
    startTime = typeof data.startTime === "string" ? data.startTime : "";
    if (!ownerUid || !appointmentId) throw new Error("invalid");

    tx.update(ref, {
      status: nextStatus,
      answeredAt: FieldValue.serverTimestamp(),
      answeredAtMillis: now,
    });

    const appointmentRef = db.collection("appointments").doc(appointmentId);
    tx.update(appointmentRef, {
      confirmacao: nextStatus,
      confirmadaEm: stamp,
      updatedAt: stamp,
    });
  });

  const title = nextStatus === "confirmada" ? "Sessão confirmada" : "Pedido de remarcação";
  const body =
    nextStatus === "confirmada"
      ? startTime
        ? `Sessão das ${startTime} confirmada pelo paciente.`
        : "Uma sessão de amanhã foi confirmada."
      : startTime
        ? `Paciente pediu remarcação da sessão das ${startTime}.`
        : "Paciente pediu remarcação de uma sessão.";

  await sendPushToUser(
    db,
    ownerUid,
    {
      kind: "confirmacoes",
      title,
      body,
      url: appointmentId ? `/admin/atendimentos/${appointmentId}` : "/admin/agenda",
    },
    now
  );

  return { ok: true as const };
}
