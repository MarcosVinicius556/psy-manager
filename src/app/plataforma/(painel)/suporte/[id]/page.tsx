"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { PrimaryButton, fieldClass } from "@/components/admin/ui";
import SupportLoadError from "@/components/support/SupportLoadError";
import SupportTicketDetailShell from "@/components/support/SupportTicketDetailShell";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import { useSupportTicketDetail } from "@/hooks/useSupportApi";
import { allowedTransitions } from "@/lib/support/transitions";
import type { SupportPriority } from "@/lib/support/types";

export default function PlataformaChamadoPage() {
  const params = useParams();
  const id = String(params.id);
  const { data, loading, error, refresh } = useSupportTicketDetail(id);
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
  if (error || !ticket || !data) {
    return <SupportLoadError message={error ?? "Chamado não encontrado."} onRetry={() => void refresh()} />;
  }

  const transitions = allowedTransitions(ticket.status);

  return (
    <SupportTicketDetailShell
      data={data}
      subtitle={`${ticket.openedBy.name} · ${ticket.openedBy.email}`}
      staffExtras={
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
          <button
            type="button"
            className="btn-secondary radius-control border border-leaf px-3 py-2 text-sm"
            onClick={() => void patch({ pauseBot: true })}
          >
            Pausar bot
          </button>
          <button
            type="button"
            className="btn-secondary radius-control border border-leaf px-3 py-2 text-sm"
            onClick={() => void patch({ resumeBot: true })}
          >
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
      }
      sideActions={
        <>
          {transitions.length > 0 && (
            <section className="radius-surface border border-[var(--color-border-subtle)] bg-white p-4">
              <h2 className="mb-2 text-sm font-semibold text-ink">Alterar status</h2>
              <div className="flex flex-wrap gap-2">
                {transitions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="btn-secondary radius-control border border-leaf px-3 py-2 text-sm"
                    disabled={busy}
                    onClick={() =>
                      void patch({ status, expectedVersion: ticket.version, githubMerged: Boolean(ticket.github.mergedAt) })
                    }
                  >
                    → {status.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </section>
          )}
          {data.executions?.length ? (
            <section className="radius-surface border border-[var(--color-border-subtle)] bg-white p-4">
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
        </>
      }
      composer={
        <div className="grid gap-2">
          <textarea
            className={fieldClass}
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Resposta ao usuário"
          />
          <PrimaryButton type="button" disabled={busy} onClick={() => void postReply()}>
            Responder
          </PrimaryButton>
        </div>
      }
    />
  );
}
