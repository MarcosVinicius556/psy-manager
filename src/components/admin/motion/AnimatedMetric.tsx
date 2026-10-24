"use client";

import { useEffect, useState } from "react";
import { animate } from "motion/react";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

export default function AnimatedMetric({
  value,
  format = (n) => String(Math.round(n)),
  className = "",
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(() => (reduced ? format(value) : format(0)));

  useEffect(() => {
    if (reduced) {
      setDisplay(format(value));
      return;
    }
    const controls = animate(0, value, {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(format(latest)),
    });
    return () => controls.stop();
  }, [format, reduced, value]);

  return <span className={className}>{display}</span>;
}
