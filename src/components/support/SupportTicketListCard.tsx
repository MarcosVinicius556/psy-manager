"use client";

import Link from "next/link";
import SupportStatusBadge from "@/components/support/SupportStatusBadge";
import { PRIORITY_LABELS } from "@/lib/support/labels";
import type { SupportTicketRecord } from "@/lib/support/types";

function formatRelative(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function SupportTicketListCard({
  ticket,
  href,
  openedByLine,
}: {
  ticket: SupportTicketRecord & { badges?: Record<string, boolean> };
  href: string;
  openedByLine?: string;
}) {
  return (
    <Link
      href={href}
      data-testid="support-ticket-card"
      className="motion-press admin-list-card box-border flex w-full max-w-full min-w-0 gap-3 overflow-hidden border border-[var(--color-border-subtle)] bg-white px-4 py-3.5 text-left transition-colors hover:bg-sky-soft/40"
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold tracking-wide text-teal">{ticket.humanId}</span>
          <SupportStatusBadge status={ticket.status} />
        </div>
        <p className="mt-1 line-clamp-2 text-sm font-medium text-ink">{ticket.title}</p>
        {openedByLine ? <p className="mt-0.5 truncate text-xs text-muted">{openedByLine}</p> : null}
        <p className="mt-1 text-xs text-muted">Atualizado {formatRelative(ticket.updatedAt)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center gap-1 text-right text-xs text-muted">
        <span className="font-medium text-ink">{PRIORITY_LABELS[ticket.priority]}</span>
        {ticket.badges?.stalled && <span className="text-amber-800">Parado</span>}
        {ticket.badges?.botFailed && <span className="text-red-800">Bot falhou</span>}
        {ticket.badges?.waitingHuman && <span className="text-violet-800">Aguardando humano</span>}
      </div>
    </Link>
  );
}
