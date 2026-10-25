import type { ClinicAttachment } from "./types";
import { authorizedHeaders } from "./api-auth";
import type { UploadKind } from "@/lib/server/upload-policy";

export type AttachmentKind = "foto" | "documento";

export type ClinicUploadTarget = {
  kind: UploadKind;
  patientId?: string;
  appointmentId?: string;
  paymentId?: string;
  ticketId?: string;
};

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_LIMIT = 5 * 1024 * 1024;
const DOCUMENT_LIMIT = 10 * 1024 * 1024;

export function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.type === "application/x-pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function clinicFileError(file: File, kind: AttachmentKind) {
  const type = file.type === "image/jpg" ? "image/jpeg" : file.type;
  if (kind === "foto") {
    if (!PHOTO_TYPES.includes(type)) return "Esse tipo de arquivo não é aceito. A foto precisa ser PNG, JPG ou WebP.";
    if (file.size > PHOTO_LIMIT) return "A foto precisa ter no máximo 5 MB.";
    return null;
  }
  if (!file.type.startsWith("image/") && !isPdfFile(file)) {
    return "Esse tipo de arquivo não é aceito. Envie uma imagem ou um PDF.";
  }
  if (file.size > DOCUMENT_LIMIT) return "O arquivo precisa ter no máximo 10 MB.";
  return null;
}

function uploadQuery(target: ClinicUploadTarget, kind: AttachmentKind) {
  const params = new URLSearchParams({ accept: kind, kind: target.kind });
  if (target.patientId) params.set("patientId", target.patientId);
  if (target.appointmentId) params.set("appointmentId", target.appointmentId);
  if (target.paymentId) params.set("paymentId", target.paymentId);
  if (target.ticketId) params.set("ticketId", target.ticketId);
  return params;
}

export async function uploadClinicFile(file: File, target: ClinicUploadTarget, kind: AttachmentKind): Promise<ClinicAttachment> {
  const invalid = clinicFileError(file, kind);
  if (invalid) throw new Error(invalid);
  const form = new FormData();
  form.append("file", file);
  const headers = await authorizedHeaders();
  const response = await fetch(`/api/image/upload?${uploadQuery(target, kind).toString()}`, {
    method: "POST",
    headers,
    body: form,
  });
  const data = (await response.json()) as {
    url?: string;
    asset?: ClinicAttachment["asset"];
    error?: string;
  };
  if (!response.ok) throw new Error(data.error || "Não foi possível enviar o arquivo.");
  if (data.asset?.publicId) {
    return {
      id: crypto.randomUUID(),
      nome: file.name || (kind === "foto" ? "Foto" : "Arquivo"),
      asset: data.asset,
      mime: isPdfFile(file) ? "application/pdf" : file.type || "application/octet-stream",
    };
  }
  if (!data.url) throw new Error(data.error || "Não foi possível enviar o arquivo.");
  return {
    id: crypto.randomUUID(),
    nome: file.name || (kind === "foto" ? "Foto" : "Arquivo"),
    url: data.url,
    mime: isPdfFile(file) ? "application/pdf" : file.type || "application/octet-stream",
  };
}
