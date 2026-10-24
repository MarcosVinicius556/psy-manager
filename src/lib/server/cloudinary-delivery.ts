import type { UploadKind } from "@/lib/server/upload-policy";

/** Envios que continuam públicos (URL direta no Cloudinary). */
const PUBLIC_UPLOAD_KINDS: UploadKind[] = ["avatar"];

export function isPrivateUploadKind(kind: UploadKind) {
  return !PUBLIC_UPLOAD_KINDS.includes(kind);
}
