import type { CloudinaryAsset } from "@/lib/cloudinary/asset";

const PREFIX = "psy-asset:";

/** Referência embutida em markdown de modelos de contrato (sem URL pública). */
export function encodeMarkdownImageRef(asset: CloudinaryAsset) {
  const formatPart = asset.format ? `:${asset.format}` : "";
  return `${PREFIX}${asset.resourceType}:${encodeURIComponent(asset.publicId)}${formatPart}`;
}

export function parseMarkdownImageRef(url: string): CloudinaryAsset | null {
  if (!url.startsWith(PREFIX)) return null;
  const body = url.slice(PREFIX.length);
  const firstColon = body.indexOf(":");
  if (firstColon < 0) return null;
  const resourceType = body.slice(0, firstColon);
  if (resourceType !== "image" && resourceType !== "raw" && resourceType !== "video") return null;
  const rest = body.slice(firstColon + 1);
  const lastColon = rest.lastIndexOf(":");
  let publicIdEnc = rest;
  let format: string | undefined;
  if (lastColon > 0) {
    const maybeFormat = rest.slice(lastColon + 1);
    if (maybeFormat && !maybeFormat.includes("%") && maybeFormat.length <= 8) {
      format = maybeFormat;
      publicIdEnc = rest.slice(0, lastColon);
    }
  }
  try {
    const publicId = decodeURIComponent(publicIdEnc);
    if (!publicId) return null;
    return { publicId, resourceType, format };
  } catch {
    return null;
  }
}
