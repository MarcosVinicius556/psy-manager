"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { PageTitle, PrimaryButton, fieldClass } from "@/components/admin/ui";
import SupportStatusBadge from "@/components/support/SupportStatusBadge";
import SupportThread from "@/components/support/SupportThread";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import { useSupportTicketDetail } from "@/hooks/useSupportApi";
import { allowedTransitions } from "@/lib/support/transitions";
import type { SupportPriority } from "@/lib/support/types";

export default function PlataformaChamadoPage() {
  const params = useParams();
  const id = String(params.id);
  const { data, loading, refresh } = useSupportTicketDetail(id);
  const ticket = data?.ticket;
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const headers = await authorizedHeaders({ "Content-Type": "application/json" });
      const res = await fetch(`/api/support/admin/tickets/${id}`, { method: "PATCH", headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      await refresh();
    } catch {
      toast.error("Falha ao atualizar chamado.");
    } finally {
      setBusy(false);
    }
  }

  async function postReply() {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      const headers = await authorizedHeaders({ "Content-Type": "application/json" });
      const res = await fetch(`/api/support/tickets/${id}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ body: reply }),
      });
      if (!res.ok) throw new Error();
      setReply("");
      await refresh();
    } catch {
      toast.error("Falha ao enviar mensagem.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-muted">Carregando...</p>;
  if (!ticket) return <p className="text-sm text-red-700">Chamado não encontrado.</p>;

  const transitions = allowedTransitions(ticket.status);

  return (
    <div className="grid gap-4">
      <PageTitle title={ticket.humanId} subtitle={`${ticket.openedBy.name} · ${ticket.openedBy.email}`} />
      <SupportStatusBadge status={ticket.status} />
      <div className="flex flex-wrap gap-2 text-sm">
        {ticket.github.issueUrl && (
          <a href={ticket.github.issueUrl} className="text-teal underline" target="_blank" rel="noreferrer">Issue</a>
        )}
        {ticket.github.prUrl && (
          <a href={ticket.github.prUrl} className="text-teal underline" target="_blank" rel="noreferrer">PR</a>
        )}
        {ticket.github.branch && <span className="text-muted">Branch: {ticket.github.branch}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          className={fieldClass}
          value={ticket.priority}
          onChange={(e) => void patch({ priority: e.target.value as SupportPriority })}
          aria-label="Prioridade"
        >
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>
        <button type="button" className="btn-secondary radius-control border border-leaf px-3 py-2 text-sm" onClick={() => void patch({ pauseBot: true })}>
          Pausar bot
        </button>
        <button type="button" className="btn-secondary radius-control border border-leaf px-3 py-2 text-sm" onClick={() => void patch({ resumeBot: true })}>
          Retomar bot
        </button>
        <button
          type="button"
          className="btn-secondary radius-control border border-leaf px-3 py-2 text-sm"
          onClick={() => void patch({ assignee: { type: "human", name: "Atendimento humano" }, pauseBot: true })}
        >
          Assumir atendimento
        </button>
      </div>
      {transitions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {transitions.map((status) => (
            <button
              key={status}
              type="button"
              className="btn-secondary radius-control border border-leaf px-3 py-2 text-sm"
              disabled={busy}
              onClick={() => void patch({ status, expectedVersion: ticket.version, githubMerged: Boolean(ticket.github.mergedAt) })}
            >
              → {status.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      )}
      <SupportThread messages={data?.messages ?? []} />
      <div className="grid gap-2">
        <textarea className={fieldClass} rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Resposta interna ao usuário" />
        <PrimaryButton type="button" disabled={busy} onClick={() => void postReply()}>Responder</PrimaryButton>
      </div>
      {data?.executions?.length ? (
        <section className="radius-surface border border-[#e7eee8] bg-white p-4">
          <h2 className="text-sm font-medium text-ink">Execuções do bot</h2>
          <ul className="mt-2 space-y-2 text-sm text-muted">
            {data.executions.map((run) => (
              <li key={run.id}>
                {run.outcome} · tentativa {run.attempt} · {run.error ?? "ok"}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
