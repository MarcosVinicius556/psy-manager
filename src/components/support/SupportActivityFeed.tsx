"use client";

import type { ActivityItem } from "@/lib/support/workflow";
import { historyEventLabel } from "@/lib/support/workflow";
import { renderSafeMarkdown } from "@/lib/support/markdown";
import { statusLabel } from "@/lib/support/labels";
import type { SupportHistoryEvent, SupportTicketStatus } from "@/lib/support/types";

const messageTone: Record<string, string> = {
  user: "border-[var(--color-border-subtle)] bg-white",
  admin: "border-teal/25 bg-teal/5",
  atendente: "border-teal/25 bg-teal/5",
  bot: "border-violet-200 bg-violet-50/80",
};

function historyBody(event: SupportHistoryEvent) {
  const to = event.to as { status?: SupportTicketStatus; reason?: string } | undefined;
  if (to?.status) return `${statusLabel(to.status)}${to.reason ? ` — ${to.reason}` : ""}`;
  if (event.type === "github_update") return "Links de issue/PR atualizados.";
  return event.data?.reason ? String(event.data.reason) : "Registro de auditoria.";
}

export default function SupportActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="grid gap-3" data-testid="support-activity-feed">
      {items.map((item) => {
        if (item.kind === "history") {
          const isBot = item.event.actor.role === "bot" || item.event.type.startsWith("bot_");
          return (
            <article
              key={item.id}
              className="radius-surface border border-[var(--color-border-subtle)] bg-paper/60 px-4 py-3"
            >
              <header className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="font-medium text-ink">{historyEventLabel(item.event)}</span>
                <span>·</span>
                <span>{item.event.actor.name}</span>
                {isBot ? (
                  <span className="rounded-[var(--radius-control)] bg-violet-700 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-white">
                    Grok Bot
                  </span>
                ) : null}
                <time dateTime={item.at}>{new Date(item.at).toLocaleString("pt-BR")}</time>
              </header>
              <p className="text-sm text-ink">{historyBody(item.event)}</p>
            </article>
          );
        }

        const message = item.message;
        return (
          <article
            key={item.id}
            className={`radius-surface border px-4 py-3 ${messageTone[message.authorType] ?? messageTone.user}`}
          >
            <header className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-ink">{message.authorName}</span>
              {message.authorType === "bot" ? (
                <span className="rounded-[var(--radius-control)] bg-violet-700 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-white">
                  Grok Bot
                </span>
              ) : message.authorType !== "user" ? (
                <span className="rounded-[var(--radius-control)] bg-teal/10 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-teal">
                  Equipe
                </span>
              ) : null}
              <time className="text-xs text-muted" dateTime={item.at}>
                {new Date(item.at).toLocaleString("pt-BR")}
              </time>
            </header>
            <div
              className="prose-support text-sm text-ink [&_a]:text-teal [&_code]:rounded-[var(--radius-control)] [&_code]:bg-paper [&_code]:px-1"
              dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(message.body) }}
            />
            {message.attachments.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {message.attachments.map((att) => (
                  <li key={att.id}>{att.nome}</li>
                ))}
              </ul>
            )}
          </article>
        );
      })}
    </div>
  );
}
