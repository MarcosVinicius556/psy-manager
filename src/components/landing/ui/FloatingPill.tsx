"use client";

import { motion } from "motion/react";
import { springNav } from "@/lib/motion/presets";

type FloatingPillProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export default function FloatingPill({ children, className = "", delay = 0 }: FloatingPillProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.88, y: 8 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...springNav, delay }}
      className={`landing-float-pill pointer-events-none absolute z-20 whitespace-nowrap shadow-[0_12px_32px_rgba(36,48,40,0.12)] ${className}`}
    >
      {children}
    </motion.span>
  );
}
