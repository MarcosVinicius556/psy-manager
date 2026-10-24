"use client";

type Props = {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
};

export default function CookiePreferenceSwitch({ checked, onChange, disabled, label }: Props) {
  if (disabled) {
    return (
      <span
        className="shrink-0 rounded-full bg-[#e7eee8] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted"
        data-testid="cookie-pref-always-on"
      >
        Sempre ativo
      </span>
    );
  }

  const trackClass = checked
    ? "border-teal bg-teal"
    : "border-[#d7e0d8] bg-[#e7eee8]";
  const thumbClass = checked ? "translate-x-[1.375rem]" : "translate-x-0.5";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal ${trackClass}`}
      onClick={() => onChange?.(!checked)}
    >
      <span
        className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${thumbClass}`}
        aria-hidden
      />
    </button>
  );
}
