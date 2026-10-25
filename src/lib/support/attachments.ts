import { SUPPORT_ATTACHMENT_MAX_BYTES, SUPPORT_ATTACHMENT_MIME_ALLOWLIST } from "./constants";
import type { SupportAttachmentMeta } from "./types";

export function validateAttachmentMime(mime: string): boolean {
  const normalized = mime.toLowerCase().split(";")[0].trim();
  if (normalized === "application/x-log" || normalized.endsWith(".log")) return true;
  return SUPPORT_ATTACHMENT_MIME_ALLOWLIST.has(normalized) || normalized === "text/log";
}

export function validateAttachmentSize(size: number): boolean {
  return size > 0 && size <= SUPPORT_ATTACHMENT_MAX_BYTES;
}

export function validateAttachmentMeta(meta: Pick<SupportAttachmentMeta, "mime" | "size">): string | null {
  if (!validateAttachmentSize(meta.size)) return "Anexo excede o tamanho máximo de 10 MB.";
  if (!validateAttachmentMime(meta.mime)) return "Tipo de arquivo não permitido.";
  return null;
}
