"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiOutlineChevronDown } from "react-icons/hi";

export type SelectOption = { value: string; label: string };

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Selecione",
  disabled = false,
  required = false,
  name,
  className = "",
  fullWidth = true,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  className?: string;
  fullWidth?: boolean;
}) {
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState({ top: 0, left: 0, width: 0, upward: false });
  const selected = options.find((option) => option.value === value);

  function place() {
    const rect = button.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    const upward = spaceBelow < 240 && rect.top > spaceBelow;
    setBox({ top: upward ? rect.top - 8 : rect.bottom + 8, left: rect.left, width: rect.width, upward });
  }

  useEffect(() => {
    if (!open) return;
    place();
    function onPointer(event: MouseEvent) {
      const element = event.target instanceof Element ? event.target : (event.target as Node).parentElement;
      if (element && (root.current?.contains(element) || element.closest(`[data-select="${listId}"]`))) return;
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
  }, [listId, open]);

  const menu = open ? (
    <ul
      id={listId}
      data-select={listId}
      role="listbox"
      style={{
        position: "fixed",
        left: box.left,
        width: box.width,
        top: box.upward ? undefined : box.top,
        bottom: box.upward ? window.innerHeight - box.top : undefined,
      }}
      className="z-[80] max-h-60 overflow-auto rounded-md border border-[#e2e8ea] bg-white py-1 font-sans shadow-[0_18px_50px_rgba(61,82,64,0.14)]"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <li key={`${option.value}-${option.label}`}>
            <button
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm ${active ? "bg-teal text-white" : "text-ink hover:bg-sky-soft"}`}
            >
              {option.label}
            </button>
          </li>
        );
      })}
    </ul>
  ) : null;

  return (
    <div ref={root} className={`font-sans ${fullWidth ? "w-full" : "inline-block min-w-44"} ${className}`}>
      {name ? <input type="hidden" name={name} value={value} required={required} /> : null}
      <button
        ref={button}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (!open) place();
          setOpen((current) => !current);
        }}
        className="flex w-full items-center justify-between gap-3 rounded-md border border-[#e2e8ea] bg-white px-4 py-3 text-left text-sm text-ink outline-none transition-colors focus:border-teal disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={selected ? "truncate" : "truncate text-muted"}>{selected?.label || placeholder}</span>
        <HiOutlineChevronDown className={`shrink-0 text-teal transition-transform ${open ? "rotate-180" : ""}`} size={18} />
      </button>
      {menu && typeof document !== "undefined" ? createPortal(menu, document.body) : null}
    </div>
  );
}
