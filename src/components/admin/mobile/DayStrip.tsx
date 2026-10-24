"use client";

import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";
import { monthLabel, shiftDate, startOfWeek, todayISO } from "@/lib/admin/format";

const weekday = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function label(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(y, m - 1, d);
  return { dow: weekday[day.getDay()], dom: String(d) };
}

export default function DayStrip({
  selected,
  marks,
  onSelect,
}: {
  selected: string;
  marks?: Record<string, number>;
  onSelect: (date: string) => void;
}) {
  const weekStart = startOfWeek(selected);
  const days = Array.from({ length: 7 }, (_, i) => shiftDate(weekStart, i));
  const today = todayISO();
  const monthIso = selected.slice(0, 7);

  function shiftWeek(delta: number) {
    onSelect(shiftDate(selected, delta * 7));
  }

  return (
    <div className="min-w-0" data-day-strip>
      <div className="mb-2 flex items-center justify-between gap-1">
        <button
          type="button"
          aria-label="Semana anterior"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[#e2e8ea] text-teal"
          onClick={() => shiftWeek(-1)}
        >
          <HiOutlineChevronLeft size={18} />
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-medium capitalize text-teal">{monthLabel(monthIso)}</p>
        <button
          type="button"
          aria-label="Próxima semana"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[#e2e8ea] text-teal"
          onClick={() => shiftWeek(1)}
        >
          <HiOutlineChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5" role="group" aria-label="Dias da semana">
        {days.map((date) => {
          const { dow, dom } = label(date);
          const active = date === selected;
          const count = marks?.[date] ?? 0;
          const isToday = date === today;
          return (
            <button
              key={date}
              type="button"
              data-day={date}
              onClick={() => onSelect(date)}
              className={`flex min-w-0 flex-col items-center rounded-lg border px-0.5 py-1.5 text-center transition-colors ${
                active
                  ? "border-teal bg-teal text-white shadow-sm"
                  : isToday
                    ? "border-accent/60 bg-white text-ink ring-1 ring-inset ring-accent/50"
                    : "border-[#e2e8ea] bg-white text-ink"
              }`}
              aria-pressed={active}
              aria-current={isToday ? "date" : undefined}
              aria-label={`${dow} ${dom}${count ? `, ${count} atendimentos` : ""}${isToday ? ", hoje" : ""}`}
            >
              <span className={`text-[0.55rem] font-semibold uppercase leading-none ${active ? "text-white/90" : "text-muted"}`}>
                {dow.slice(0, 3)}
              </span>
              <span className="font-num text-sm font-semibold leading-tight">{dom}</span>
              {count > 0 ? (
                <span className={`mt-0.5 h-1 w-1 rounded-full ${active ? "bg-white" : "bg-accent"}`} aria-hidden="true" />
              ) : (
                <span className="mt-0.5 h-1 w-1" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
