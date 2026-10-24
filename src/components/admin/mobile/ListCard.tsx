"use client";

import type { ReactNode } from "react";
import Link from "next/link";

export default function ListCard({
  href,
  onClick,
  title,
  subtitle,
  meta,
  trailing,
  children,
}: {
  href?: string;
  onClick?: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  const className =
    "flex w-full max-w-full min-w-0 min-h-[4.5rem] gap-3 rounded-md border border-[#e7eee8] bg-white px-4 py-3 text-left shadow-[0_8px_24px_rgba(61,82,64,0.06)] transition-colors active:bg-sky-soft/60";

  const body = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-medium text-ink">{title}</p>
          {meta ? <div className="shrink-0">{meta}</div> : null}
        </div>
        {subtitle ? <p className="mt-0.5 line-clamp-2 break-all text-sm text-muted">{subtitle}</p> : null}
        {children}
      </div>
      {trailing ? <div className="flex shrink-0 flex-col items-end justify-center gap-1">{trailing}</div> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}
