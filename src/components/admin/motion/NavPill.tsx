"use client";

import { motion } from "motion/react";
import { springNav } from "@/lib/motion/presets";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

export function SidebarActivePill({ layoutId = "admin-sidebar-pill" }: { layoutId?: string }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <span className="absolute inset-0 rounded-md border border-white bg-white" aria-hidden />;
  }
  return (
    <motion.span
      layoutId={layoutId}
      className="absolute inset-0 rounded-md border border-white bg-white"
      transition={springNav}
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
