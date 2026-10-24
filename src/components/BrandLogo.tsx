import Image from "next/image";

type BrandLogoProps = {
  variant?: "mark" | "lockup";
  height?: number;
  className?: string;
  priority?: boolean;
};

export default function BrandLogo({ variant = "lockup", height = 40, className = "", priority = false }: BrandLogoProps) {
  if (variant === "mark") {
    const width = Math.round(height * (239 / 286));
    return (
      <Image
        src="/images/logo/mark.png"
        alt="Psy Manager"
        width={width * 2}
        height={height * 2}
        quality={100}
        unoptimized
        priority={priority}
        className={`h-auto w-auto ${className}`}
        style={{ height, width: "auto" }}
      />
    );
  }

  const width = Math.round(height * (854 / 357));
  return (
    <Image
      src="/images/logo/psy-manager.jpg"
      alt="Psy Manager — Gestão clínica para psicólogos"
      width={width * 2}
      height={height * 2}
      quality={100}
      unoptimized
      priority={priority}
      className={`h-auto w-auto ${className}`}
      style={{ height, width: "auto" }}
    />
  );
}
