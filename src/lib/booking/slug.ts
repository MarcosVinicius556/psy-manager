import { BOOKING_SLUG_MAX, BOOKING_SLUG_MIN } from "./config";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const RESERVED = new Set([
  "admin",
  "api",
  "agendar",
  "confirmar",
  "feedback",
  "login",
  "privacidade",
  "termos",
  "plataforma",
  "planos",
]);

export function normalizeBookingSlug(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, BOOKING_SLUG_MAX);
}

export function validateBookingSlug(slug: string): string | null {
  if (slug.length < BOOKING_SLUG_MIN) return `Use pelo menos ${BOOKING_SLUG_MIN} caracteres.`;
  if (slug.length > BOOKING_SLUG_MAX) return `Use no máximo ${BOOKING_SLUG_MAX} caracteres.`;
  if (!SLUG_RE.test(slug)) return "Use apenas letras minúsculas, números e hífens.";
  if (RESERVED.has(slug)) return "Este endereço não está disponível.";
  return null;
}
