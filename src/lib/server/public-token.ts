const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Tokens públicos (feedback, assinatura, formulário). */
export function isValidPublicToken(token: string) {
  const trimmed = token.trim();
  if (UUID_RE.test(trimmed)) return true;
  return /^[a-zA-Z0-9]{20}$/.test(trimmed);
}

export function sanitizeSignerName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 120);
}

export function sanitizeSignerCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits;
}

export function sanitizeUserAgent(value: string) {
  return value.trim().slice(0, 512);
}
