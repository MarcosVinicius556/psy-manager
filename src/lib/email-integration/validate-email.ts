const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidRecipientEmail(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > 254) return false;
  return EMAIL_RE.test(trimmed);
}

export function normalizeRecipientEmail(value: string) {
  return value.trim().toLowerCase();
}
