import { v2 as cloudinary } from "cloudinary";
import type { CloudinaryAsset, CloudinaryResourceType } from "@/lib/cloudinary/asset";

const SIGNED_URL_TTL_SECONDS = 300;

export function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export function cloudinaryConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function signedAuthenticatedUrl(asset: CloudinaryAsset, expiresAtSec?: number) {
  const expiresAt = expiresAtSec ?? Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS;
  const resourceType = asset.resourceType as CloudinaryResourceType;
  const options: Record<string, unknown> = {
    resource_type: resourceType,
    type: "authenticated",
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
  };
  if (asset.format && resourceType === "image") {
    options.format = asset.format;
  }
  return cloudinary.url(asset.publicId, options);
}
