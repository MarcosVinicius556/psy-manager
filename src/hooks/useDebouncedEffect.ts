"use client";

import { useEffect, useRef } from "react";

export function useDebouncedEffect(effect: () => void | Promise<void>, deps: unknown[], delayMs: number) {
  const version = useRef(0);
  useEffect(() => {
    version.current += 1;
    const current = version.current;
    const timer = window.setTimeout(() => {
      if (current !== version.current) return;
      void effect();
    }, delayMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce over caller deps
  }, deps);
}
