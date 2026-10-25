"use client";

import { Button } from "@/components/ui/Button";

export default function SupportLoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="radius-surface grid gap-3 border border-[var(--color-border-subtle)] bg-white px-4 py-5 text-center"
      role="alert"
    >
      <p className="text-sm text-red-800">{message}</p>
      <Button variant="secondary" className="mx-auto radius-control px-4 py-2 text-sm" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}
