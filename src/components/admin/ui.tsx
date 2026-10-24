import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-md bg-white p-6 shadow-[0_18px_50px_rgba(61,82,64,0.08)] ${className}`}>
      {children}
    </section>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[clamp(1.8rem,3vw,2.4rem)] font-medium text-teal">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export const fieldClass =
  "w-full rounded-md border border-[#e2e8ea] bg-white px-4 py-3 font-sans text-sm text-ink outline-none transition-colors focus:border-teal";

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
    <div className="overflow-x-auto">
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
