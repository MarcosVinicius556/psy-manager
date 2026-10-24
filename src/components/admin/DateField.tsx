"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiOutlineCalendar } from "react-icons/hi";
import CalendarPanel from "@/components/admin/CalendarPanel";
import { fieldClass } from "@/components/admin/ui";
import { formatDate, monthLabel, todayISO } from "@/lib/admin/format";

type DateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  mode?: "date" | "month";
  min?: string;
  required?: boolean;
  disabled?: boolean;
  zIndex?: number;
};

export default function DateField({
  value,
  onChange,
  mode = "date",
  min = "",
  required = false,
  disabled = false,
  zIndex = 80,
}: DateFieldProps) {
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(value.slice(0, 7) || todayISO().slice(0, 7));
  const [box, setBox] = useState({ top: 0, left: 0, upward: false });

  function place() {
    const rect = button.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 292;
    const spaceBelow = window.innerHeight - rect.bottom;
    const upward = spaceBelow < 340 && rect.top > spaceBelow;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    setBox({ top: upward ? rect.top - 8 : rect.bottom + 8, left, upward });
  }

  useEffect(() => {
    if (!open) return;
    setCursor(value.slice(0, 7) || todayISO().slice(0, 7));
    place();
    function onPointer(event: MouseEvent) {
      const element = event.target instanceof Element ? event.target : (event.target as Node).parentElement;
      if (element && (root.current?.contains(element) || element.closest(`[data-date="${panelId}"]`))) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, panelId, value]);

  const label = value
    ? mode === "month"
      ? monthLabel(value.slice(0, 7))
      : formatDate(value)
    : mode === "month"
      ? "Selecione o mês"
      : "Selecione a data";

  const panel = open ? (
    <div
      data-date={panelId}
      style={{
        position: "fixed",
        left: box.left,
        width: 292,
        top: box.upward ? undefined : box.top,
        bottom: box.upward ? window.innerHeight - box.top : undefined,
        zIndex,
      }}
      className="rounded-md border border-[#e2e8ea] bg-white p-3 shadow-[0_18px_50px_rgba(61,82,64,0.14)]"
    >
      <CalendarPanel
        month={cursor}
        onMonth={setCursor}
        selected={value}
        min={min}
        pick={mode === "month" ? "month" : "day"}
        onSelect={(next) => {
          onChange(next);
          setOpen(false);
        }}
      />
      <div className="mt-3 flex items-center justify-between border-t border-[#e7eee8] pt-2">
        {!required && value ? (
          <button
            type="button"
            className="btn-text px-2 py-1 text-xs"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            Limpar
          </button>
        ) : (
          <span />
        )}
        {mode === "date" && (
          <button
            type="button"
            className="btn-text px-2 py-1 text-xs"
            onClick={() => {
              const today = todayISO();
              if (min && today < min) return;
              onChange(today);
              setOpen(false);
            }}
          >
            Hoje
          </button>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div ref={root} className="relative font-sans">
      <input
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        value={value}
        required={required}
        onChange={() => undefined}
      />
      <button
        ref={button}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`${fieldClass} flex items-center justify-between gap-3 text-left ${disabled ? "bg-paper text-muted" : ""}`}
      >
        <span className={`capitalize ${value ? "text-ink" : "text-muted"}`}>{label}</span>
        <HiOutlineCalendar className="shrink-0 text-sage" size={18} />
      </button>
      {typeof document !== "undefined" && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
