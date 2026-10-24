import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-md bg-white p-4 shadow-[0_18px_50px_rgba(61,82,64,0.08)] sm:p-6 ${className}`}>
      {children}
    </section>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-[clamp(1.7rem,1.2rem+2vw,2.4rem)] font-medium leading-tight text-teal">{title}</h1>
        {subtitle && <p className="mt-1 text-sm leading-relaxed text-muted sm:text-base">{subtitle}</p>}
      </div>
      {action ? <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">{action}</div> : null}
    </div>
  );
}

export const fieldClass =
  "w-full min-h-12 rounded-md border border-[#e2e8ea] bg-white px-4 py-3 font-sans text-base text-ink outline-none transition-colors focus:border-teal";

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
