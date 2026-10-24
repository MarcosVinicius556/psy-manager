"use client";

import { useEffect, useState, type ReactNode } from "react";
import { HiOutlineX } from "react-icons/hi";

export default function Drawer({
  open,
  title,
  onClose,
  children,
  footer,
  size = "default",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "default" | "wide";
}) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [held, setHeld] = useState(children);

  useEffect(() => {
    if (open) setHeld(children);
  }, [open, children]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }
    setShown(false);
    const timer = window.setTimeout(() => setMounted(false), 300);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div className={`fixed inset-0 z-50 ${shown ? "" : "pointer-events-none"}`} aria-hidden={!shown}>
      <button
        type="button"
        aria-label="Fechar painel"
        tabIndex={shown ? 0 : -1}
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${shown ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute inset-0 flex h-full w-full flex-col bg-white shadow-[0_18px_50px_rgba(61,82,64,0.18)] transition-transform duration-300 ease-out sm:inset-y-0 sm:right-0 sm:left-auto ${
          size === "wide" ? "sm:max-w-[44rem]" : "sm:max-w-[560px]"
        } ${shown ? "translate-x-0" : "translate-x-full"}`}
      >
        <header
          className="flex items-center justify-between gap-3 border-b border-[#e7eee8] px-4 py-3 sm:px-6 sm:py-5"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <h2 className="font-serif text-[clamp(1.4rem,5vw,1.75rem)] font-medium leading-tight text-teal">{title}</h2>
          <button
            type="button"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-transparent text-teal transition-colors duration-300 hover:border-teal hover:bg-transparent"
            onClick={onClose}
            aria-label="Fechar"
          >
            <HiOutlineX size={22} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">{held}</div>
        {footer ? (
          <div
            className="border-t border-[#e7eee8] px-4 py-3 sm:px-6 sm:py-4"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            {footer}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
