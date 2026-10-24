import { authorizedHeaders } from "@/lib/admin/api-auth";
import type { ClinicAttachment, CloudinaryAsset } from "@/lib/admin/types";
import { isCloudinaryAsset, mediaApiPath, publicIdFromLegacyUrl, serializeMediaQuery } from "@/lib/cloudinary/asset";

export function resolveAttachmentAsset(attachment: ClinicAttachment): CloudinaryAsset | null {
  if (isCloudinaryAsset(attachment.asset)) return attachment.asset;
  const legacy = attachment.url?.trim();
  if (!legacy) return null;
  if (legacy.startsWith("/api/media?")) {
    const params = new URLSearchParams(legacy.split("?")[1] || "");
    const publicId = params.get("publicId");
    const resourceType = params.get("resourceType");
    if (publicId && (resourceType === "image" || resourceType === "raw" || resourceType === "video")) {
      return { publicId, resourceType, format: params.get("format") || undefined };
    }
  }
  return publicIdFromLegacyUrl(legacy);
}

export function patientPhotoAsset(patient: { foto: string; fotoAsset?: CloudinaryAsset | null }): CloudinaryAsset | null {
  if (isCloudinaryAsset(patient.fotoAsset)) return patient.fotoAsset;
  const legacy = patient.foto?.trim();
  if (!legacy) return null;
  return publicIdFromLegacyUrl(legacy);
}

export async function fetchSignedMediaUrl(asset: CloudinaryAsset): Promise<string> {
  const headers = await authorizedHeaders();
  const response = await fetch(`/api/media?${serializeMediaQuery(asset)}&mode=json`, { headers });
  const data = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !data.url) {
    throw new Error(data.error || "Não foi possível carregar o arquivo.");
  }
  return data.url;
}

export async function openAttachment(attachment: ClinicAttachment) {
  const asset = resolveAttachmentAsset(attachment);
  if (asset) {
    const url = await fetchSignedMediaUrl(asset);
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  const legacy = attachment.url?.trim();
  if (legacy) window.open(legacy, "_blank", "noopener,noreferrer");
}

export async function openClinicPdfFromAttachment(attachment: ClinicAttachment, nome?: string) {
  const asset = resolveAttachmentAsset(attachment);
  if (asset && asset.resourceType === "raw") {
    const headers = await authorizedHeaders();
    const filename = nome || attachment.nome || "documento.pdf";
    const query = new URLSearchParams({
      publicId: asset.publicId,
      resourceType: asset.resourceType,
      name: filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`,
    });
    if (asset.format) query.set("format", asset.format);
    const response = await fetch(`/api/pdf?${query.toString()}`, { headers });
    if (!response.ok) throw new Error("Não foi possível abrir o PDF.");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    return;
  }
  const url = attachment.url?.trim();
  if (!url) throw new Error("Arquivo indisponível.");
  const { openClinicPdf } = await import("@/lib/admin/reports");
  await openClinicPdf(url, nome || attachment.nome);
}

export function attachmentIsPrivate(attachment: ClinicAttachment) {
  return Boolean(resolveAttachmentAsset(attachment));
}

export { mediaApiPath };
