"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { pageItem, pageStagger } from "@/lib/motion/presets";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

export function AdminPageMotion({ routeKey, children }: { routeKey: string; children: ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <div key={routeKey}>{children}</div>;

  return (
    <motion.div
      key={routeKey}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: pageStagger },
      }}
    >
      {children}
    </motion.div>
  );
}

export function AdminStaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div className={className} variants={pageItem}>
      {children}
    </motion.div>
  );
}
