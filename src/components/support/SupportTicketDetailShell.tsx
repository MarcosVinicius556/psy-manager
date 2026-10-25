"use client";

import type { ReactNode } from "react";
import SupportActivityFeed from "@/components/support/SupportActivityFeed";
import SupportStatusBadge from "@/components/support/SupportStatusBadge";
import SupportWorkflowTimeline from "@/components/support/SupportWorkflowTimeline";
import { PRIORITY_LABELS, statusLabel } from "@/lib/support/labels";
import { buildWorkflowSteps, mergeActivity } from "@/lib/support/workflow";
import type { TicketDetailPayload } from "@/hooks/useSupportApi";

const classificationLabel: Record<string, string> = {
  informativo: "Informativo",
  simples: "Simples",
  medio: "Médio",
  critico: "Crítico",
};

export default function SupportTicketDetailShell({
  data,
  subtitle,
  staffExtras,
  composer,
  sideActions,
}: {
  data: TicketDetailPayload;
  subtitle?: string;
  staffExtras?: ReactNode;
  composer: ReactNode;
  sideActions?: ReactNode;
}) {
  const { ticket, messages, history, signedAttachments } = data;
  const workflowSteps = buildWorkflowSteps(ticket, history);
  const activity = mergeActivity(messages, history);

  return (
    <div className="grid min-w-0 gap-6" data-testid="support-ticket-detail">
      <header className="grid gap-3 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 grid gap-1">
            <p className="font-mono text-sm font-semibold tracking-wide text-teal">{ticket.humanId}</p>
            <h1 className="text-xl font-semibold text-ink">{ticket.title}</h1>
            {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <SupportStatusBadge status={ticket.status} />
            <span className="inline-flex rounded-[var(--radius-control)] bg-paper px-2 py-0.5 text-xs font-medium text-ink">
              {PRIORITY_LABELS[ticket.priority]}
            </span>
          </div>
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs text-muted">Aberto por</dt>
            <dd className="text-ink">{ticket.openedBy.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Responsável</dt>
            <dd className="text-ink">
              {ticket.assignee.name}
              {ticket.assignee.type === "bot" ? " (automação)" : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Classificação</dt>
            <dd className="text-ink">
              {ticket.classification ? classificationLabel[ticket.classification] ?? ticket.classification : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Criado em</dt>
            <dd className="text-ink">{new Date(ticket.createdAt).toLocaleString("pt-BR")}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Atualizado em</dt>
            <dd className="text-ink">{new Date(ticket.updatedAt).toLocaleString("pt-BR")}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Status</dt>
            <dd className="text-ink">{statusLabel(ticket.status)}</dd>
          </div>
        </dl>
        {(ticket.github.issueUrl || ticket.github.prUrl) && (
          <div className="flex flex-wrap gap-3 text-sm">
            {ticket.github.issueUrl ? (
              <a href={ticket.github.issueUrl} className="text-teal underline" target="_blank" rel="noreferrer">
                Issue {ticket.github.issueNumber ? `#${ticket.github.issueNumber}` : ""}
              </a>
            ) : null}
            {ticket.github.prUrl ? (
              <a href={ticket.github.prUrl} className="text-teal underline" target="_blank" rel="noreferrer">
                PR {ticket.github.prNumber ? `#${ticket.github.prNumber}` : ""}
              </a>
            ) : null}
            {ticket.github.branch ? <span className="text-muted">Branch {ticket.github.branch}</span> : null}
          </div>
        )}
        {staffExtras}
      </header>

      <div className="grid min-w-0 gap-6 min-[960px]:grid-cols-[minmax(0,1fr)_280px]">
        <section className="grid min-w-0 gap-4">
          <h2 className="text-sm font-semibold text-ink">Atividade</h2>
          <SupportActivityFeed items={activity} />
          <div className="border-t border-[var(--color-border-subtle)] pt-4">{composer}</div>
        </section>

        <aside className="grid min-w-0 gap-4 min-[960px]:sticky min-[960px]:top-4 min-[960px]:self-start">
          <section className="radius-surface border border-[var(--color-border-subtle)] bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink">Fluxo do chamado</h2>
            <SupportWorkflowTimeline steps={workflowSteps} />
          </section>
          {signedAttachments.length > 0 && (
            <section className="radius-surface border border-[var(--color-border-subtle)] bg-white p-4">
              <h2 className="mb-2 text-sm font-semibold text-ink">Anexos</h2>
              <ul className="space-y-2 text-sm">
                {signedAttachments.map((att) => (
                  <li key={att.id}>
                    <a href={att.url} className="text-teal underline" target="_blank" rel="noreferrer">
                      {att.nome}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {sideActions}
        </aside>
      </div>
    </div>
  );
}
