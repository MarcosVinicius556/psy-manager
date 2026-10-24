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
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Fechar painel"
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute inset-y-0 right-0 flex h-full w-full flex-col bg-white shadow-[0_18px_50px_rgba(61,82,64,0.18)] transition-transform duration-300 ease-out ${
          size === "wide" ? "max-w-[44rem]" : "max-w-[560px]"
        } ${shown ? "translate-x-0" : "translate-x-full"}`}
      >
        <header className="flex items-center justify-between gap-4 border-b border-[#e7eee8] px-6 py-5">
          <h2 className="font-serif text-2xl font-medium text-teal">{title}</h2>
          <button
            type="button"
            className="rounded-md border border-transparent p-2 text-teal transition-colors duration-300 hover:border-teal hover:bg-transparent"
            onClick={onClose}
            aria-label="Fechar"
          >
            <HiOutlineX size={22} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{held}</div>
        {footer ? <div className="border-t border-[#e7eee8] px-6 py-4">{footer}</div> : null}
      </aside>
    </div>
  );
}
