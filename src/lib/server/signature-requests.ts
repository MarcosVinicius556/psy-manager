import { hashLegalContent } from "@/lib/legal/hash";

export const SIGNATURE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type SignatureDocKind = "tcle" | "contrato" | "consentimento_gravacao" | "consentimento_imagem";

export type PublicSignatureView = {
  kind: SignatureDocKind;
  title: string;
  body: string;
  version: string;
  expired: boolean;
  signed: boolean;
  requiresGuardian: boolean;
};

export function signatureExpired(data: Record<string, unknown>) {
  const millis = Number(data.expiresAtMillis);
  if (Number.isFinite(millis) && millis > 0) return millis <= Date.now();
  const iso = typeof data.expiresAt === "string" ? data.expiresAt : "";
  if (!iso) return false;
  return Date.parse(iso) <= Date.now();
}

export function signatureSigned(data: Record<string, unknown>) {
  return Boolean(data.signedAt || data.signedAtMillis);
}

export function signatureContentHash(body: string) {
  return hashLegalContent(body);
}

export function publicSignatureTitle(kind: SignatureDocKind) {
  if (kind === "tcle") return "Termo de Consentimento (TCLE)";
  if (kind === "contrato") return "Contrato de prestação de serviços";
  if (kind === "consentimento_gravacao") return "Consentimento para gravação";
  return "Consentimento para uso de imagem";
}

export function toPublicSignatureView(data: Record<string, unknown>): PublicSignatureView {
  const kind = (typeof data.kind === "string" ? data.kind : "tcle") as SignatureDocKind;
  const body = typeof data.body === "string" ? data.body : "";
  const version = typeof data.templateVersion === "string" ? data.templateVersion : "1";
  return {
    kind,
    title: publicSignatureTitle(kind),
    body,
    version,
    expired: signatureExpired(data),
    signed: signatureSigned(data),
    requiresGuardian: Boolean(data.requiresGuardian),
  };
}
