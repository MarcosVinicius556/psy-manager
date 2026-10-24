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
  const width = 56;
  const height = 28;
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((v, index) => {
    const x = index * step;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const linePath = points.length ? `M ${points.join(" L ")}` : "";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <motion.path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-teal/35"
        initial={reduced ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
      />
      {values.map((v, index) => {
        const x = index * step;
        const y = height - (v / max) * (height - 4) - 2;
        return (
          <motion.circle
            key={index}
            cx={x}
            cy={y}
            r={index === values.length - 1 ? 2.5 : 1.75}
            className={index === values.length - 1 ? "fill-teal" : "fill-teal/30"}
            initial={reduced ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: reduced ? 0 : 0.08 * index, duration: 0.25 }}
          />
        );
      })}
    </svg>
  );
}
