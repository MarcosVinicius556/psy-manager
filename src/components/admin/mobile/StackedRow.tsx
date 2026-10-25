import type { ReactNode } from "react";

type StackedRowProps = {
  primary: ReactNode;
  secondary?: ReactNode;
  /** Legacy: combined right column (e.g. calendar widget). */
  meta?: ReactNode;
  amount?: ReactNode;
  status?: ReactNode;
  hint?: ReactNode;
  /** @deprecated Use `actions` for a full-width action row. */
  action?: ReactNode;
  actions?: ReactNode;
};

const shellClass =
  "admin-list-card min-w-0 border border-[#e7eee8] bg-white px-4 py-3.5 text-left";

export default function StackedRow({
  primary,
  secondary,
  meta,
  amount,
  status,
  hint,
  action,
  actions,
}: StackedRowProps) {
  const structured = amount !== undefined || status !== undefined;

  if (structured) {
    const actionRow = actions ?? action;
    return (
      <div className={shellClass}>
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1 font-medium text-ink">{primary}</div>
          {amount != null ? <div className="shrink-0 font-num text-sm font-semibold text-ink">{amount}</div> : null}
        </div>
        {secondary || status ? (
          <div className="mt-1 flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1 text-sm leading-snug text-muted">{secondary}</div>
            {status ? <div className="shrink-0">{status}</div> : null}
          </div>
        ) : null}
        {hint ? <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p> : null}
        {actionRow ? <div className="admin-list-actions mt-3">{actionRow}</div> : null}
      </div>
    );
  }

  return (
    <div className={`${shellClass} flex min-w-0 flex-col gap-3`}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-ink">{primary}</div>
          {secondary ? <div className="mt-0.5 line-clamp-2 text-sm text-muted">{secondary}</div> : null}
        </div>
        {meta ? <div className="shrink-0 text-right text-sm">{meta}</div> : null}
      </div>
      {hint || action ? (
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0 flex-1 text-xs leading-relaxed text-muted">{hint}</div>
          {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
