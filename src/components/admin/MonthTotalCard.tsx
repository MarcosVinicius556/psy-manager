"use client";

import { HiArrowDown, HiArrowUp, HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";
import { Card } from "@/components/admin/ui";
import { addMonths, formatMoney, monthLabel } from "@/lib/admin/format";

export function titledMonth(isoMonth: string) {
  const label = monthLabel(isoMonth);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function monthChange(current: number, previous: number) {
  if (current === previous) return { direction: "same" as const, percent: 0 };
  if (previous === 0) return { direction: current > 0 ? ("up" as const) : ("down" as const), percent: 100 };
  const percent = (Math.abs(current - previous) / previous) * 100;
  const rounded = percent >= 10 ? Math.round(percent) : Math.round(percent * 10) / 10;
  return { direction: current > previous ? ("up" as const) : ("down" as const), percent: rounded };
}

type MonthTotalCardProps = {
  title: string;
  month: string;
  value: number;
  previous: number;
  minMonth?: string;
  maxMonth?: string;
  onMonth?: (month: string) => void;
  /** When true, an increase is shown in red and a decrease in green (e.g. expenses or overdue). */
  invertTone?: boolean;
  footnote?: string;
};

export default function MonthTotalCard({
  title,
  month,
  minMonth,
  maxMonth,
  value,
  previous,
  onMonth,
  invertTone = false,
  footnote,
}: MonthTotalCardProps) {
  const change = monthChange(value, previous);
  const upGood = invertTone ? "text-[#b42318]" : "text-[#1f7a45]";
  const downGood = invertTone ? "text-[#1f7a45]" : "text-[#b42318]";
  const tone = change.direction === "up" ? upGood : change.direction === "down" ? downGood : "text-ink";
  return (
    <Card>
      <p className="text-sm text-muted">{title}</p>
      {onMonth && minMonth && maxMonth ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            className="btn-text px-2"
            aria-label="Mês anterior"
            disabled={month <= minMonth}
            onClick={() => onMonth(addMonths(month, -1))}
          >
            <HiOutlineChevronLeft size={18} />
          </button>
          <p className="text-center text-sm font-medium text-ink">{titledMonth(month)}</p>
          <button
            type="button"
            className="btn-text px-2"
            aria-label="Próximo mês"
            disabled={month >= maxMonth}
            onClick={() => onMonth(addMonths(month, 1))}
          >
            <HiOutlineChevronRight size={18} />
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm font-medium text-ink">{titledMonth(month)}</p>
      )}
      <p className={`mt-3 font-num text-4xl font-semibold ${tone}`}>{formatMoney(value)}</p>
      {change.direction === "same" ? (
        <p className="mt-2 text-sm text-ink">Mesmo valor do mês anterior</p>
      ) : (
        <p className={`mt-2 flex items-center gap-1 text-sm font-semibold ${tone}`}>
          {change.direction === "up" ? <HiArrowUp size={16} /> : <HiArrowDown size={16} />}
          {change.percent.toLocaleString("pt-BR")}%
        </p>
      )}
      {footnote ? <p className="mt-2 font-num text-sm text-muted">{footnote}</p> : null}
    </Card>
  );
}
