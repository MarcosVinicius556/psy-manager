"use client";

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
  const cols = options.length;
  return (
    <div
      className="grid w-full min-w-0 gap-1.5"
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
            className={`min-h-11 min-w-0 truncate rounded-full border px-2 py-2 text-center text-xs font-medium leading-tight sm:px-3 sm:text-sm ${
              active ? "border-teal bg-teal text-white" : "border-[#d7e0d8] bg-white text-ink"
            }`}
            onClick={() => onChange(option.value)}
            title={option.label}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
