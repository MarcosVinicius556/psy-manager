import crypto from "node:crypto";

const TOKEN_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AppointmentConfirmationStatus = "pendente" | "confirmada" | "remarcar";

export type PublicSessionConfirmationView = {
  professionalNome: string;
  sessionDate: string;
  startTime: string;
  modality: "online" | "presencial";
  placeLabel: string;
  expired: boolean;
  answered: boolean;
  status: AppointmentConfirmationStatus | null;
};

export function isValidSessionConfirmationToken(token: string) {
  return Boolean(token && token.length <= 64 && TOKEN_UUID_RE.test(token));
}

export function sessionReminderMarkerId(appointmentId: string, sessionDateYmd: string) {
  return `sessao_${appointmentId}_lembrete_${sessionDateYmd}`;
}

export function reminderUnsubscribeToken(ownerUid: string, patientId: string) {
  const secret = process.env.CRON_SECRET?.trim() || process.env.EMAIL_UNSUBSCRIBE_SECRET?.trim() || "dev-unsubscribe";
  return crypto.createHmac("sha256", secret).update(`${ownerUid}:${patientId}:lembretes`).digest("base64url");
}

export function verifyReminderUnsubscribeToken(ownerUid: string, patientId: string, token: string) {
  if (!token) return false;
  const expected = reminderUnsubscribeToken(ownerUid, patientId);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function confirmationExpired(data: Record<string, unknown>, nowMs = Date.now()) {
  const millis = data.expiresAtMillis;
  if (typeof millis === "number" && millis > 0) return millis <= nowMs;
  const expiresAt = typeof data.expiresAt === "string" ? data.expiresAt.trim() : "";
  if (!expiresAt) return true;
  const parsed = Date.parse(expiresAt);
  return Number.isNaN(parsed) || parsed <= nowMs;
}

export function confirmationAnswered(data: Record<string, unknown>) {
  const status = data.status;
  return status === "confirmada" || status === "remarcar";
}

export function toPublicSessionConfirmationView(
  data: Record<string, unknown>,
  nowMs = Date.now()
): PublicSessionConfirmationView {
  const modality = data.modality === "online" ? "online" : "presencial";
  const statusRaw = data.status;
  const status =
    statusRaw === "confirmada" || statusRaw === "remarcar" || statusRaw === "pendente" ? statusRaw : null;
  return {
    professionalNome: typeof data.professionalNome === "string" ? data.professionalNome.trim() : "",
    sessionDate: typeof data.sessionDate === "string" ? data.sessionDate.trim() : "",
    startTime: typeof data.startTime === "string" ? data.startTime.trim() : "",
    modality,
    placeLabel: typeof data.placeLabel === "string" ? data.placeLabel.trim() : "",
    expired: confirmationExpired(data, nowMs),
    answered: confirmationAnswered(data),
    status,
  };
}

export function publicConfirmationHasPatientPii(payload: Record<string, unknown>) {
  const forbiddenKeys = [
    "patientId",
    "patientNome",
    "patientEmail",
    "email",
    "cpf",
    "telefone",
    "ownerUid",
    "appointmentId",
  ];
  return forbiddenKeys.some((key) => {
    const value = payload[key];
    return typeof value === "string" && value.length > 0;
  });
}
