"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

export default function LocationMenu({ id, className = "btn-row" }: { id: string; className?: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState({ top: 0, left: 0 });

  function place() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setBox({ top: rect.bottom + 8, left: rect.right });
  }

  useEffect(() => {
    if (!open) return;
    place();
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={className}
        aria-label="Agenda e despesas"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        style={{ width: "1.9rem", height: "1.9rem", padding: 0, lineHeight: 0, alignSelf: "center" }}
      >
        <span aria-hidden="true" style={{ display: "block", fontSize: "1.05rem", letterSpacing: "0.04em", lineHeight: 1, transform: "translateY(-0.22em)" }}>
          ...
        </span>
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-50 min-w-40 rounded-md border border-leaf bg-white py-1 shadow-[0_18px_50px_rgba(61,82,64,0.12)]"
            style={{ top: box.top, left: box.left, transform: "translateX(-100%)" }}
          >
            <Link
              href={`/admin/locais/${id}`}
              role="menuitem"
              className="block px-4 py-2 text-sm text-ink hover:bg-paper"
              onClick={() => setOpen(false)}
            >
              Agenda
            </Link>
            <Link
              href={`/admin/locais/${id}/despesas`}
              role="menuitem"
              className="block px-4 py-2 text-sm text-ink hover:bg-paper"
              onClick={() => setOpen(false)}
            >
              Despesas
            </Link>
          </div>,
          document.body
        )}
    </>
  );
}
