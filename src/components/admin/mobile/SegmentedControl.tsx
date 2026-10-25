"use client";

import { LayoutGroup } from "motion/react";
import { motion } from "motion/react";
import { springNav } from "@/lib/motion/presets";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

export default function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  const reduced = useReducedMotion();
  const cols = options.length;

  return (
    <LayoutGroup id="segmented-control">
      <div
        className="relative grid w-full min-w-0 gap-1 rounded-md border border-[#d7e0d8] bg-white p-1"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        role="tablist"
        aria-label={ariaLabel}
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              className={`motion-press relative z-10 min-h-11 min-w-0 truncate rounded-md px-2 py-2 text-center text-xs font-medium leading-tight transition-colors sm:px-3 sm:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${
                active ? "text-white" : "text-ink"
              }`}
              onClick={() => onChange(option.value)}
              title={option.label}
            >
              {active ? (
                reduced ? (
                  <span className="absolute inset-0 rounded-md bg-teal" aria-hidden />
                ) : (
                  <motion.span
                    layoutId="segmented-pill"
                    className="absolute inset-0 rounded-md bg-teal"
                    transition={springNav}
                    aria-hidden
                  />
                )
              ) : null}
              <span className="relative">{option.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
