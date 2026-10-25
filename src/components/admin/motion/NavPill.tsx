"use client";

import { motion } from "motion/react";
import { springNav } from "@/lib/motion/presets";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

export function SidebarActivePill({ layoutId = "admin-sidebar-pill" }: { layoutId?: string }) {
  const reduced = useReducedMotion();
  const className =
    "pointer-events-none absolute inset-0 rounded-[var(--radius-control)] bg-white/22 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]";
  if (reduced) {
    return <span className={className} data-testid="admin-sidebar-pill" aria-hidden />;
  }
  return (
    <motion.span
      layoutId={layoutId}
      className={className}
      transition={springNav}
      data-testid="admin-sidebar-pill"
      aria-hidden
    />
  );
}

/** Compact bubble behind the tab icon only (stays inside the bottom bar). */
export function TabActiveBubble({ layoutId = "admin-mobile-tab-bubble" }: { layoutId?: string }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <span className="absolute inset-0 rounded-md bg-teal/12" aria-hidden />;
  }
  return (
    <motion.span
      layoutId={layoutId}
      className="absolute inset-0 rounded-md bg-teal/12"
      transition={springNav}
      aria-hidden
    />
  );
}
