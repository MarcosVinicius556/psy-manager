"use client";

import type { ReactNode } from "react";
import { HiOutlineMenu } from "react-icons/hi";

export default function MobileHeader({
  title,
  action,
  onOpenMenu,
}: {
  title: string;
  action?: ReactNode;
  onOpenMenu?: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-[#d7e0d8] bg-white/95 text-ink backdrop-blur-md desk:hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className={`flex h-14 items-center gap-3 ${onOpenMenu ? "px-3" : "px-4"}`}>
        {onOpenMenu ? (
          <button
            type="button"
            className="btn-icon shrink-0"
            aria-label="Abrir menu"
            onClick={onOpenMenu}
          >
            <HiOutlineMenu size={22} />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-lg font-semibold leading-tight text-teal">{title}</p>
        </div>
        {action ? (
          <div className="flex shrink-0 items-center gap-1 [&_.btn-primary]:min-h-11 [&_.btn-primary]:px-3 [&_.btn-primary]:py-2 [&_.btn-primary]:text-sm">
            {action}
          </div>
        ) : null}
      </div>
    </header>
  );
}
