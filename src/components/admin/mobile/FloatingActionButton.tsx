"use client";

import { useEffect, useState, type ReactNode } from "react";
import { HiOutlinePlus } from "react-icons/hi";

export default function FloatingActionButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastY = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      if (y < 32) setCompact(false);
      else if (y - lastY > 6) setCompact(true);
      else if (lastY - y > 6) setCompact(false);
      lastY = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`fixed right-4 z-20 inline-flex min-h-11 items-center justify-center rounded-full border border-accent bg-accent font-semibold text-white shadow-[0_12px_32px_rgba(196,122,90,0.45)] transition-[padding,gap,transform] duration-200 active:scale-[0.98] md:hidden ${
        compact ? "gap-0 p-3" : "gap-2 px-5 py-3 text-sm"
      }`}
      style={{ bottom: "calc(6.1rem + env(safe-area-inset-bottom))" }}
      aria-label={label}
      title={label}
    >
      {icon ?? <HiOutlinePlus size={22} aria-hidden />}
      <span className={compact ? "sr-only" : undefined}>{label}</span>
    </button>
  );
}
