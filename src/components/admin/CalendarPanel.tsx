"use client";

import { useEffect, useRef, useState } from "react";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";
import { WEEKDAYS, addMonths, buildMonthCells, todayISO } from "@/lib/admin/format";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MONTH_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type CalendarPanelProps = {
  month: string;
  onMonth: (month: string) => void;
  selected: string;
  min?: string;
  marks?: Record<string, number>;
  onSelect: (value: string) => void;
  pick?: "day" | "month";
};

function NavButton({ label, direction, onClick }: { label: string; direction: "prev" | "next"; onClick: () => void }) {
  const Icon = direction === "prev" ? HiOutlineChevronLeft : HiOutlineChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#e2e8ea] text-teal hover:bg-sky-soft"
    >
      <Icon size={18} />
    </button>
  );
}

export default function CalendarPanel({
  month,
  onMonth,
  selected,
  min = "",
  marks = {},
  onSelect,
  pick = "day",
}: CalendarPanelProps) {
  const today = todayISO();
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  const minMonth = min.slice(0, 7);
  const nowYear = Number(today.slice(0, 4));
  const minYear = min ? Number(min.slice(0, 4)) : nowYear - 120;
  const maxYear = nowYear + 10;
  const [level, setLevel] = useState<"day" | "month" | "year">(pick === "month" ? "month" : "day");
  const yearList = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (level !== "year" || !yearList.current) return;
    const current = yearList.current.querySelector<HTMLElement>("[data-current='true']");
    if (!current) return;
    yearList.current.scrollTop = Math.max(0, current.offsetTop - yearList.current.clientHeight / 2);
  }, [level]);

  if (level === "year") {
    return (
      <div className="font-sans">
        <div className="mb-3 flex items-center justify-between">
          <span className="h-8 w-8" />
          <strong className="text-base font-medium text-teal">Ano</strong>
          <span className="h-8 w-8" />
        </div>
        <div ref={yearList} className="grid max-h-52 grid-cols-4 gap-1.5 overflow-y-auto">
          {Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index).map((item) => {
            const active = item === year;
            return (
              <button
                key={item}
                type="button"
                data-current={active ? "true" : undefined}
                onClick={() => {
                  onMonth(`${item}-${month.slice(5, 7)}`);
                  setLevel("month");
                }}
                className={`min-h-11 rounded-md text-base ${active ? "bg-teal text-white" : "text-ink hover:bg-sky-soft"}`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (level === "month" || pick === "month") {
    return (
      <div className="font-sans">
        <div className="mb-3 flex items-center justify-between">
          <NavButton label="Ano anterior" direction="prev" onClick={() => onMonth(addMonths(month, -12))} />
          <button type="button" className="rounded-md px-2 py-1 text-base font-medium text-teal hover:bg-sky-soft" onClick={() => setLevel("year")}>
            {year}
          </button>
          <NavButton label="Próximo ano" direction="next" onClick={() => onMonth(addMonths(month, 12))} />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {MONTH_SHORT.map((label, index) => {
            const value = `${year}-${String(index + 1).padStart(2, "0")}`;
            const active = selected.slice(0, 7) === value;
            const blocked = Boolean(minMonth) && value < minMonth;
            return (
              <button
                key={value}
                type="button"
                disabled={blocked}
                onClick={() => {
                  if (pick === "month") onSelect(value);
                  else {
                    onMonth(value);
                    setLevel("day");
                  }
                }}
                className={`min-h-11 rounded-md text-base ${
                  active
                    ? "bg-teal text-white"
                    : blocked
                      ? "text-[#b7c0b8]"
                      : "text-ink hover:bg-sky-soft"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans">
      <div className="mb-3 flex items-center justify-between gap-2">
        <NavButton label="Mês anterior" direction="prev" onClick={() => onMonth(addMonths(month, -1))} />
        <span className="flex items-center gap-2 text-base font-medium text-teal">
          <button type="button" className="rounded-md px-1 hover:bg-sky-soft" onClick={() => setLevel("month")}>
            {MONTHS[monthIndex]}
          </button>
          <button type="button" className="rounded-md px-1 hover:bg-sky-soft" onClick={() => setLevel("year")}>
            {year}
          </button>
        </span>
        <NavButton label="Próximo mês" direction="next" onClick={() => onMonth(addMonths(month, 1))} />
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-[0.7rem] font-semibold uppercase tracking-wide text-muted">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-1">
            {day.slice(0, 3)}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {buildMonthCells(month).map((date, index) => {
          if (!date) return <span key={`empty-${month}-${index}`} />;
          const active = date === selected;
          const blocked = Boolean(min) && date < min;
          const count = marks[date] || 0;
          return (
            <button
              key={date}
              type="button"
              disabled={blocked}
              onClick={() => onSelect(date)}
              className={`relative mx-auto flex aspect-square w-full max-w-11 items-center justify-center rounded-md text-sm ${
                active
                  ? "bg-teal text-white"
                  : blocked
                    ? "text-[#b7c0b8]"
                    : date === today
                      ? "text-ink ring-1 ring-inset ring-accent hover:bg-sky-soft"
                      : "text-ink hover:bg-sky-soft"
              }`}
            >
              {Number(date.slice(-2))}
              {count > 0 && (
                <span className={`absolute bottom-1 h-1 w-1 rounded-full ${active ? "bg-white" : "bg-accent"}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
