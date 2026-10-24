"use client";

import { shiftDate, todayISO } from "@/lib/admin/format";

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
  radius = 6,
}: {
  selected: string;
  marks?: Record<string, number>;
  onSelect: (date: string) => void;
  radius?: number;
}) {
  const start = shiftDate(selected, -radius);
  const days = Array.from({ length: radius * 2 + 1 }, (_, i) => shiftDate(start, i));
  const today = todayISO();

  return (
    <div
      data-allow-horizontal-scroll="true"
      className="-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Dias da semana"
    >
      {days.map((date) => {
        const { dow, dom } = label(date);
        const active = date === selected;
        const count = marks?.[date] ?? 0;
        const isToday = date === today;
        return (
          <button
            key={date}
            type="button"
            onClick={() => onSelect(date)}
            className={`flex min-w-[3.25rem] shrink-0 flex-col items-center rounded-xl border px-2 py-2 text-center transition-colors ${
              active ? "border-teal bg-teal text-white" : "border-[#e2e8ea] bg-white text-ink"
            }`}
            aria-pressed={active}
            aria-label={`${dow} ${dom}${count ? `, ${count} atendimentos` : ""}`}
          >
            <span className={`text-[0.65rem] font-medium uppercase ${active ? "text-white/85" : "text-muted"}`}>{dow}</span>
            <span className="font-num text-lg font-semibold leading-none">{dom}</span>
            {isToday && !active ? <span className="mt-1 text-[0.6rem] font-semibold text-accent">Hoje</span> : null}
            {count > 0 ? (
              <span
                className={`mt-1 h-1.5 w-1.5 rounded-full ${active ? "bg-white" : "bg-accent"}`}
                aria-hidden="true"
              />
            ) : (
              <span className="mt-1 h-1.5 w-1.5" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}
