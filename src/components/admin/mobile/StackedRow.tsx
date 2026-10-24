import type { ReactNode } from "react";

export default function StackedRow({
  primary,
  secondary,
  meta,
  hint,
  action,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  meta?: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#eef2ee] py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-ink">{primary}</div>
          {secondary ? <div className="mt-0.5 line-clamp-2 text-sm text-muted">{secondary}</div> : null}
        </div>
        {meta ? <div className="shrink-0 text-right text-sm">{meta}</div> : null}
      </div>
      {hint || action ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 text-xs leading-relaxed text-muted">{hint}</div>
          {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
