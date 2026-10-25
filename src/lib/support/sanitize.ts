const THIRD_PARTY_EMAIL = /\b[A-Z0-9._%+-]+@(?!psy-manager|gmail\.com\/psy)[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}\b/gi;
const API_KEY = /\b(sk|pk|rk|ghp|gho|github_pat)_[A-Za-z0-9]{16,}\b/g;
const PRIVATE_KEY = /-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+PRIVATE KEY-----/g;
const GENERIC_SECRET = /\b(api[_-]?key|secret|password|token)\s*[:=]\s*['"]?[^\s'"]{8,}/gi;

export function scrubSecrets(text: string): string {
  return text
    .replace(PRIVATE_KEY, "[redacted-private-key]")
    .replace(BEARER, "Bearer [redacted]")
    .replace(API_KEY, "[redacted-token]")
    .replace(GENERIC_SECRET, "[redacted-secret]")
    .replace(THIRD_PARTY_EMAIL, "[redacted-email]");
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeTicketBody(raw: string, max = 12000): string {
  const trimmed = raw.replace(/\u0000/g, "").trim();
  if (trimmed.length > max) return trimmed.slice(0, max);
  return scrubSecrets(trimmed);
}
