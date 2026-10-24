"use client";

import type { ReactNode } from "react";
import Link from "next/link";

export default function ListCard({
  href,
  onClick,
  title,
  subtitle,
  subtitleLines,
  meta,
  trailing,
  children,
}: {
  href?: string;
  onClick?: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  /** When set, renders each line on its own row with ellipsis (preferred for phone + email). */
  subtitleLines?: string[];
  meta?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  const className =
    "motion-press admin-card box-border flex w-full max-w-full min-w-0 min-h-[4.5rem] gap-3 overflow-hidden border border-[#e7eee8] bg-white px-4 py-3.5 text-left transition-colors active:bg-sky-soft/60";

  const body = (
    <>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <p className="min-w-0 flex-1 truncate font-medium text-ink">{title}</p>
          {meta ? <div className="max-w-[40%] shrink-0">{meta}</div> : null}
        </div>
        {subtitleLines && subtitleLines.length > 0 ? (
          <div className="mt-0.5 space-y-0.5">
            {subtitleLines.map((line) => (
              <p key={line} className="truncate text-sm text-muted" title={line}>
                {line}
              </p>
            ))}
          </div>
        ) : subtitle ? (
          <p className="mt-0.5 line-clamp-2 break-words text-sm text-muted [overflow-wrap:anywhere]">{subtitle}</p>
        ) : null}
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
