"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { HiOutlineMenu } from "react-icons/hi";
import BrandLogo from "@/components/BrandLogo";

export default function MobileHeader({
  title,
  action,
  onOpenMenu,
}: {
  title: string;
  action?: ReactNode;
  onOpenMenu: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-[#d7e0d8] bg-white/95 text-ink backdrop-blur-md lg:hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-14 items-center gap-2 px-3">
        <button
          type="button"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-[#e2e8ea] text-teal"
          aria-label="Abrir menu"
          onClick={onOpenMenu}
        >
          <HiOutlineMenu size={22} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-lg font-semibold leading-tight text-teal">{title}</p>
        </div>
        {action ? <div className="flex shrink-0 items-center gap-1 [&_.btn-primary]:min-h-11 [&_.btn-primary]:px-3 [&_.btn-primary]:py-2 [&_.btn-primary]:text-sm">{action}</div> : null}
      </div>
    </header>
  );
}

export function MobileHeaderBrand({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-[#d7e0d8] bg-white text-ink lg:hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-14 items-center justify-between gap-3 px-3">
        <Link href="/admin" aria-label="Psy Manager" className="rounded-md bg-paper px-2 py-1">
          <BrandLogo variant="lockup" height={30} className="max-w-[58vw]" />
        </Link>
        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-md border border-[#e2e8ea] text-teal"
          aria-label="Abrir menu"
          onClick={onOpenMenu}
        >
          <HiOutlineMenu size={22} />
        </button>
      </div>
    </header>
  );
}
