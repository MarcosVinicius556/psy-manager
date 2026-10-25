import Image from "next/image";
import type { LandingShot } from "@/lib/landing/screenshots";

export default function LandingScreenshot({
  shot,
  className = "",
  priority,
  loading,
  sizes = "(max-width: 768px) 100vw, 720px",
}: {
  shot: LandingShot;
  className?: string;
  priority?: boolean;
  loading?: "lazy" | "eager";
  sizes?: string;
}) {
  return (
    <picture>
      {shot.avif ? <source srcSet={shot.avif} type="image/avif" /> : null}
      <Image
        src={shot.src}
        alt={shot.alt}
        width={shot.width}
        height={shot.height}
        className={`block h-auto w-full bg-paper ${className}`}
        sizes={sizes}
        priority={priority}
        loading={loading}
      />
    </picture>
  );
}
