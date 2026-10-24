import type { ReactNode } from "react";

/** Renders children only from the `md` breakpoint up (avoids Tailwind `flex` overriding `display:none`). */
export default function DesktopOnly({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`admin-desktop-only ${className}`}>{children}</div>;
}
