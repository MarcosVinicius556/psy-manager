import type { ReactNode } from "react";

export default function StickyActionBar({ children }: { children: ReactNode }) {
  return (
    <div
      className="sticky bottom-0 -mx-4 border-t border-[#e7eee8] bg-white/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end [&_.btn-primary]:w-full sm:[&_.btn-primary]:w-auto">
        {children}
      </div>
    </div>
  );
}
