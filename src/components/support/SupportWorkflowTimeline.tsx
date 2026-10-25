"use client";

import type { WorkflowStep } from "@/lib/support/workflow";

const dotTone: Record<string, string> = {
  done: "bg-teal border-teal",
  current: "bg-white border-teal ring-2 ring-teal/30",
  upcoming: "bg-paper border-[var(--color-border-subtle)]",
  skipped: "bg-paper border-[var(--color-border-subtle)] opacity-50",
};

export default function SupportWorkflowTimeline({ steps }: { steps: WorkflowStep[] }) {
  return (
    <nav aria-label="Progresso do chamado" className="relative pl-6">
      <div
        className="absolute left-[0.55rem] top-2 bottom-2 w-px bg-[var(--color-border-subtle)] motion-reduce:hidden"
        aria-hidden
      />
      <ol className="grid gap-4">
        {steps.map((step, index) => (
          <li key={step.id} className="relative grid gap-1">
            <span
              className={`absolute -left-6 top-1.5 size-3 rounded-[var(--radius-control)] border ${dotTone[step.state]}`}
              aria-hidden
            />
            <div className="radius-surface border border-[var(--color-border-subtle)] bg-white px-3 py-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className={`text-sm font-medium ${step.state === "current" ? "text-teal" : "text-ink"}`}>
                  <span className="mr-2 font-mono text-xs text-muted">{index + 1}</span>
                  {step.label}
                </p>
                {step.at ? (
                  <time className="text-xs text-muted" dateTime={step.at}>
                    {new Date(step.at).toLocaleString("pt-BR")}
                  </time>
                ) : null}
              </div>
              {step.detail ? <p className="mt-1 text-xs text-muted">{step.detail}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
