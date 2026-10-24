import type { ReactNode } from "react";

export default function StackedRow({
  primary,
  secondary,
  meta,
  actions,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-[#eef2ee] py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-ink">{primary}</div>
          {secondary ? <div className="mt-0.5 text-sm text-muted">{secondary}</div> : null}
        </div>
        {meta ? <div className="shrink-0 text-right text-sm">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
