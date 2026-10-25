"use client";

import type { SupportTicketMessage } from "@/lib/support/types";
import { renderSafeMarkdown } from "@/lib/support/markdown";

const authorTone: Record<string, string> = {
  user: "border-[#e7eee8] bg-white",
  admin: "border-teal/20 bg-teal/5",
  atendente: "border-teal/20 bg-teal/5",
  bot: "border-violet-200 bg-violet-50/80",
};

export default function SupportThread({ messages }: { messages: SupportTicketMessage[] }) {
  return (
    <div className="grid gap-3">
      {messages.map((message) => (
        <article
          key={message.id}
          className={`radius-surface border px-4 py-3 ${authorTone[message.authorType] ?? authorTone.user}`}
        >
          <header className="mb-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-ink">{message.authorName}</span>
            {message.authorType === "bot" && (
              <span className="rounded-[var(--radius-control)] bg-violet-600 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-white">
                Grok Bot
              </span>
            )}
            <time className="text-xs text-muted">{new Date(message.createdAt).toLocaleString("pt-BR")}</time>
          </header>
          <div
            className="prose-support text-sm text-ink [&_a]:text-teal [&_code]:rounded [&_code]:bg-paper [&_code]:px-1"
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
      ))}
    </div>
  );
}
