"use client";

import { useEffect, useRef, useState } from "react";
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
  const [display, setDisplay] = useState(() => format(reduced ? value : 0));
  const animatedOnce = useRef(false);
  const formatRef = useRef(format);
  formatRef.current = format;

  useEffect(() => {
    const formatValue = formatRef.current;
    if (reduced) {
      setDisplay(formatValue(value));
      return;
    }
    if (!animatedOnce.current) {
      animatedOnce.current = true;
      const controls = animate(0, value, {
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (latest) => setDisplay(formatValue(latest)),
      });
      return () => controls.stop();
    }
    setDisplay(formatValue(value));
  }, [reduced, value]);

  return <span className={className}>{display}</span>;
}
