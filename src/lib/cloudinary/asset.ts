export type CloudinaryResourceType = "image" | "raw" | "video";

export interface CloudinaryAsset {
  publicId: string;
  resourceType: CloudinaryResourceType;
  format?: string;
}

export function isCloudinaryAsset(value: unknown): value is CloudinaryAsset {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<CloudinaryAsset>;
  return typeof data.publicId === "string" && data.publicId.length > 0 && typeof data.resourceType === "string";
}

export function attachmentHasMedia(attachment: { url?: string; asset?: CloudinaryAsset }) {
  return Boolean(attachment.url?.trim() || isCloudinaryAsset(attachment.asset));
}

export function serializeMediaQuery(asset: CloudinaryAsset) {
  const params = new URLSearchParams({
    publicId: asset.publicId,
    resourceType: asset.resourceType,
  });
  if (asset.format) params.set("format", asset.format);
  return params.toString();
}

export function mediaApiPath(asset: CloudinaryAsset) {
  return `/api/media?${serializeMediaQuery(asset)}`;
}

/** Extrai public_id de uma URL legada do Cloudinary (delivery upload). */
export function publicIdFromLegacyUrl(url: string): CloudinaryAsset | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("cloudinary.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const deliveryIdx = parts.findIndex((p) => p === "upload" || p === "authenticated" || p === "private");
    if (deliveryIdx < 0 || deliveryIdx + 1 >= parts.length) return null;
    let i = deliveryIdx + 1;
    if (/^v\d+$/.test(parts[i])) i += 1;
    const rest = parts.slice(i).join("/");
    if (!rest) return null;
    const resourceType = parts[0] === "raw" || parts[0] === "video" ? (parts[0] as CloudinaryResourceType) : "image";
    const formatMatch = rest.match(/\.([a-zA-Z0-9]+)$/);
    const format = formatMatch?.[1];
    const publicId = format ? rest.replace(/\.[a-zA-Z0-9]+$/, "") : rest;
    return { publicId, resourceType, format };
  } catch {
    return null;
  }
}
