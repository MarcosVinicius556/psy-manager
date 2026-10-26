import type { Appointment, Payment, Patient, SessionFeedback } from "./types";

const MS_DAY = 24 * 60 * 60 * 1000;

export function noShowRate(appointments: Appointment[], days = 90, now = Date.now()) {
  const since = now - days * MS_DAY;
  const window = appointments.filter((item) => {
    const start = item.sessionStartMillis || Date.parse(`${item.date}T${item.startTime}`);
    return Number.isFinite(start) && start >= since && start <= now;
  });
  if (!window.length) return 0;
  const missed = window.filter((item) => item.status === "faltou").length;
  return Math.round((missed / window.length) * 1000) / 10;
}

export function retention90Days(patients: Patient[], appointments: Appointment[], now = Date.now()) {
  const since = now - 90 * MS_DAY;
  const activeIds = new Set<string>();
  for (const item of appointments) {
    const start = item.sessionStartMillis || Date.parse(`${item.date}T${item.startTime}`);
    if (Number.isFinite(start) && start >= since) activeIds.add(item.patientId);
  }
  const cohort = patients.filter((patient) => {
    const created = Date.parse(patient.createdAt);
    return Number.isFinite(created) && created <= since;
  });
  if (!cohort.length) return 0;
  const retained = cohort.filter((patient) => activeIds.has(patient.id)).length;
  return Math.round((retained / cohort.length) * 1000) / 10;
}

export function averageTicket(payments: Payment[], days = 90, now = Date.now()) {
  const since = now - days * MS_DAY;
  const paid = payments.filter((item) => {
    if (item.status !== "pago") return false;
    const when = Date.parse(item.paidAt || item.createdAt || "");
    return Number.isFinite(when) && when >= since;
  });
  if (!paid.length) return 0;
  const total = paid.reduce((sum, item) => sum + (item.valor ?? 0), 0);
  return Math.round((total / paid.length) * 100) / 100;
}

export function forecastVsReceived(payments: Payment[], month: string, today: string) {
  const receivable = payments
    .filter((item) => item.dueDate?.startsWith(month) && item.status !== "pago")
    .reduce((sum, item) => sum + (item.valor ?? 0), 0);
  const received = payments
    .filter((item) => item.paidAt?.startsWith(month) || (item.status === "pago" && item.dueDate?.startsWith(month)))
    .reduce((sum, item) => sum + (item.valor ?? 0), 0);
  return { receivable, received, month, today };
}

export function averageSessionRating(feedbacks: SessionFeedback[]) {
  const rated = feedbacks.filter((item) => typeof item.stars === "number" && item.stars > 0);
  if (!rated.length) return null;
  const sum = rated.reduce((acc, item) => acc + (item.stars ?? 0), 0);
  return Math.round((sum / rated.length) * 10) / 10;
}
