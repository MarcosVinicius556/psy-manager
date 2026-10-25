"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";

type NavTooltipProps = {
  label: string;
  enabled: boolean;
  children: ReactNode;
};

export function NavTooltip({ label, enabled, children }: NavTooltipProps) {
  const tooltipId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  function place() {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setBox({ top: rect.top + rect.height / 2, left: rect.right + 10 });
  }

  function show() {
    if (!enabled) return;
    place();
    setOpen(true);
  }

  function hide() {
    setOpen(false);
  }

  const tooltip =
    mounted && enabled && open
      ? createPortal(
          <motion.div
            id={tooltipId}
            role="tooltip"
            initial={reduced ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduced ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed z-[60] -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-control)] bg-footer px-3 py-1.5 text-xs font-medium text-white shadow-[0_12px_40px_rgba(23,47,51,0.35)]"
            style={{ top: box.top, left: box.left }}
          >
            {label}
          </motion.div>,
          document.body
        )
      : null;

  return (
    <div
      ref={anchorRef}
      className="w-full"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {tooltip}
    </div>
  );
}
