export const PUBLIC_FEEDBACK_COMMENT_MAX = 1000;

const FEEDBACK_TOKEN_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** Firestore auto-id (links criados antes de passar a usar UUID como id do doc). */
const FEEDBACK_TOKEN_FIRESTORE_ID_RE = /^[A-Za-z0-9]{20}$/;

export type PublicFeedbackView = {
  professionalNome: string;
  sessionDate: string;
  startTime: string;
  expired: boolean;
  answered: boolean;
};

export function isValidFeedbackToken(token: string) {
  if (!token || token.length > 64) return false;
  return FEEDBACK_TOKEN_UUID_RE.test(token) || FEEDBACK_TOKEN_FIRESTORE_ID_RE.test(token);
}

export function sanitizeFeedbackComment(raw: string) {
  const normalized = raw.normalize("NFKC");
  const withoutControls = normalized.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  return withoutControls.trim().slice(0, PUBLIC_FEEDBACK_COMMENT_MAX);
}

export function parseFeedbackRating(raw: unknown) {
  const value = typeof raw === "number" ? raw : typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isInteger(value) || value < 1 || value > 5) return null;
  return value;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function feedbackAnswered(data: Record<string, unknown>) {
  if (data.answeredAt != null && data.answeredAt !== "") return true;
  const millis = data.answeredAtMillis;
  return typeof millis === "number" && millis > 0;
}

export function feedbackExpired(data: Record<string, unknown>, nowMs = Date.now()) {
  const millis = data.expiresAtMillis;
  if (typeof millis === "number" && millis > 0) return millis <= nowMs;
  const expiresAt = text(data.expiresAt);
  if (!expiresAt) return true;
  const parsed = Date.parse(expiresAt);
  return Number.isNaN(parsed) || parsed <= nowMs;
}

export function toPublicFeedbackView(data: Record<string, unknown>, nowMs = Date.now()): PublicFeedbackView {
  return {
    professionalNome: text(data.professionalNome),
    sessionDate: text(data.sessionDate),
    startTime: text(data.startTime),
    expired: feedbackExpired(data, nowMs),
    answered: feedbackAnswered(data),
  };
}

export function publicFeedbackHasPatientPii(payload: Record<string, unknown>) {
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
