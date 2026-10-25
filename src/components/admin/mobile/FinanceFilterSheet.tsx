"use client";

import { useState } from "react";
import DateField from "@/components/admin/DateField";
import Select from "@/components/admin/Select";
import type { PaymentStatus } from "@/lib/admin/types";
import { labelPaymentStatus, monthLabel } from "@/lib/admin/format";

type StatusFilter = "todos" | PaymentStatus;

export default function FinanceFilterSheet({
  status,
  month,
  from,
  to,
  onStatus,
  onMonth,
  onFrom,
  onTo,
}: {
  status: StatusFilter;
  month: string;
  from: string;
  to: string;
  onStatus: (value: StatusFilter) => void;
  onMonth: (value: string) => void;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const statusLabel = status === "todos" ? "Todos os status" : labelPaymentStatus(status);
  const summary = [monthLabel(month), statusLabel, from || to ? "Período personalizado" : null].filter(Boolean).join(" · ");

  return (
    <div className="admin-mobile-only mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-chip min-h-11 shrink-0" onClick={() => setOpen(true)} aria-expanded={open}>
          Filtros
        </button>
        <span className="inline-flex max-w-full min-w-0 truncate rounded-md border border-[#d7e0d8] bg-paper px-3 py-1.5 text-xs text-muted">
          {monthLabel(month)}
        </span>
        {status !== "todos" ? (
          <span className="inline-flex shrink-0 rounded-md border border-teal/30 bg-sky-soft px-3 py-1.5 text-xs font-medium text-teal">
            {statusLabel}
          </span>
        ) : null}
        {(from || to) && (
          <span className="inline-flex shrink-0 rounded-md border border-[#d7e0d8] bg-white px-3 py-1.5 text-xs text-muted">
            Período
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-muted">{summary}</p>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40 bg-ink/35" aria-label="Fechar filtros" onClick={() => setOpen(false)} />
          <div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[min(85dvh,32rem)] overflow-y-auto rounded-t-2xl border border-[#d7e0d8] bg-white p-4 shadow-[0_-12px_40px_rgba(36,48,40,0.12)]"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            role="dialog"
            aria-label="Filtros do financeiro"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg font-medium text-teal">Filtros</h2>
              <button type="button" className="btn-text min-h-11 px-3" onClick={() => setOpen(false)}>
                Fechar
              </button>
            </div>
            <div className="grid gap-3">
              <Select
                value={status}
                onChange={(next) => onStatus(next as StatusFilter)}
                options={[
                  { value: "todos", label: "Todos os status" },
                  { value: "agendado", label: "Agendado" },
                  { value: "em_haver", label: "Em haver" },
                  { value: "pago", label: "Pago" },
                  { value: "nao_pago", label: "Não pago" },
                ]}
              />
              <DateField mode="month" value={month} onChange={onMonth} />
              <DateField value={from} onChange={onFrom} />
              <DateField value={to} min={from} onChange={onTo} />
            </div>
            <button type="button" className="btn-primary mt-4 min-h-11 w-full" onClick={() => setOpen(false)}>
              Aplicar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
