"use client";

import type { ReactNode } from "react";

export default function FloatingActionButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed right-4 z-20 inline-flex min-h-12 items-center gap-2 rounded-full border border-accent bg-accent px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(196,122,90,0.45)] transition-transform active:scale-[0.98] md:hidden"
      style={{ bottom: "calc(4.85rem + env(safe-area-inset-bottom))" }}
      aria-label={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
