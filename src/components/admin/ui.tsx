"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import StaggerChildren from "@/components/admin/motion/StaggerChildren";
import { AdminAccountNotices } from "@/components/admin/AccountStatus";
import { useOptionalAdminPageMeta, useSetAdminPageMeta } from "@/lib/admin/page-meta-context";
import { useOptionalSaas } from "@/lib/saas/context";

export const mobileListRowSurfaceClass = "admin-list-card border border-[#e7eee8] bg-white";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`admin-card min-w-0 overflow-hidden bg-white p-5 sm:p-6 ${className}`}>
      {children}
    </section>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold tracking-wide text-muted uppercase">{children}</p>;
}

export function CardMetric({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`font-num text-4xl font-bold leading-none text-teal sm:text-5xl ${className}`}>{children}</p>;
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  const pageMeta = useOptionalAdminPageMeta();
  const saas = useOptionalSaas();
  useSetAdminPageMeta({ title, action });
  const desktopTitleClass = pageMeta ? "min-w-0 max-desk:hidden" : "min-w-0 admin-desktop-only";
  const mobileSubtitleClass = pageMeta ? "min-w-0 desk:hidden" : "min-w-0 admin-mobile-only";

  return (
    <>
      <div className="mb-4 flex flex-col items-stretch gap-3 desk:mb-6 desk:flex-row desk:flex-wrap desk:items-end desk:justify-between desk:gap-4">
        <div className={desktopTitleClass}>
          <h1 className="text-[clamp(1.7rem,1.2rem+2vw,2.4rem)] font-medium leading-tight text-teal">{title}</h1>
          {subtitle && <p className="mt-1 text-sm leading-relaxed text-muted sm:text-base">{subtitle}</p>}
        </div>
        <div className={mobileSubtitleClass}>
          {subtitle ? <p className="text-sm leading-relaxed text-muted">{subtitle}</p> : null}
        </div>
        {action ? (
          <div className="admin-desktop-only admin-desktop-flex w-full flex-col gap-2 desk:w-auto desk:flex-row desk:flex-wrap [&>*]:w-full desk:[&>*]:w-auto">
            {action}
          </div>
        ) : null}
      </div>
      {saas ? <AdminAccountNotices /> : null}
    </>
  );
}

export function WidgetSectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="admin-section-title mb-4 flex items-end justify-between gap-3">
      <h2 className="min-w-0 text-xl font-medium leading-tight text-teal sm:text-2xl">{title}</h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function WidgetSectionFooter({ children }: { children: ReactNode }) {
  return <div className="mt-4 flex justify-end border-t border-[#eef2ee] pt-4">{children}</div>;
}

export const fieldClass =
  "w-full min-h-12 rounded-md border border-[#e2e8ea] bg-white px-4 py-3 font-sans text-base text-ink outline-none transition-colors focus:border-teal";

export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button type="button" className={`btn-primary radius-control px-4 py-2.5 text-sm font-medium disabled:opacity-60 ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="block font-sans">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </div>
  );
}

export function Pill({ children, tone = "sage" }: { children: ReactNode; tone?: "sage" | "accent" | "muted" | "teal" }) {
  const tones = {
    sage: "border-leaf bg-sky-soft text-teal",
    accent: "border-[#e8cfc4] bg-[#f6e6df] text-accent",
    muted: "border-[#d7e0d8] bg-white text-muted",
    teal: "border-teal bg-teal text-white",
  };
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-semibold leading-none ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function DataTable({ children, minWidth = 720 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="data-table -mx-1 max-w-full">
      <table className="w-full border-collapse text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`border-b border-[#d7e0d8] bg-sky-soft px-4 py-3 text-xs font-semibold uppercase tracking-wide text-teal ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`border-b border-[#eef2ee] px-4 py-3 align-middle font-num ${className}`}>{children}</td>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-md bg-paper px-4 py-6 text-center text-muted">{children}</p>;
}

export function ResponsiveTableWrap({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`admin-desktop-only ${className}`}>{children}</div>;
}

export function MobileListGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mobile-list-grid admin-mobile-only gap-3 ${className}`} data-mobile-list data-admin-stagger-grid>
      <StaggerChildren>{children}</StaggerChildren>
    </div>
  );
}

/** Vertical stack of mobile rows/cards with consistent spacing (non-grid). */
export function MobileStackedList({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mobile-stacked-list admin-mobile-only ${className}`} data-mobile-list>
      {children}
    </div>
  );
}
