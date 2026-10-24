"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

export function RingProgress({
  value,
  max = 100,
  size = 56,
  stroke = 5,
  className = "",
}: {
  value: number;
  max?: number;
  stroke?: number;
  size?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(1, Math.max(0, value / max));
  const offset = circumference * (1 - ratio);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-sky-soft"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        className="text-teal"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        strokeDasharray={circumference}
        initial={reduced ? false : { strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: reduced ? 0 : 0.75, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

export function SparkBars({
  values,
  className = "",
}: {
  values: number[];
  className?: string;
}) {
  const reduced = useReducedMotion();
  const max = Math.max(...values, 1);

  const normalized = values.length > 0 ? values : [0];

  return (
    <div className={`flex h-full items-end justify-end gap-[3px] ${className}`} aria-hidden>
      {normalized.map((v, index) => (
        <motion.span
          key={index}
          className={`w-[3px] flex-1 max-w-[4px] rounded-full ${index === normalized.length - 1 ? "bg-teal" : "bg-teal/30"}`}
          style={{ height: `${Math.max(16, (v / max) * 100)}%` }}
          initial={reduced ? false : { scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: reduced ? 0 : index * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  );
}
