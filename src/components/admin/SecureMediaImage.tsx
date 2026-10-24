"use client";

import { useEffect, useState } from "react";
import type { CloudinaryAsset } from "@/lib/admin/types";
import { fetchSignedMediaUrl } from "@/lib/cloudinary/client-media";

export default function SecureMediaImage({
  asset,
  alt,
  className,
}: {
  asset: CloudinaryAsset;
  alt: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    setSrc(null);
    fetchSignedMediaUrl(asset)
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [asset.publicId, asset.resourceType, asset.format]);

  if (failed) {
    return (
      <span className={`grid place-items-center bg-paper text-xs text-muted ${className ?? ""}`} role="img" aria-label={alt}>
        Indisponível
      </span>
    );
  }
  if (!src) {
    return <span className={`animate-pulse bg-paper ${className ?? ""}`} aria-hidden />;
  }
  return <img src={src} alt={alt} className={className} />;
}
