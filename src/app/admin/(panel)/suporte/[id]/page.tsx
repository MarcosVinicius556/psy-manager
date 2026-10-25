"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { PrimaryButton, fieldClass } from "@/components/admin/ui";
import SupportLoadError from "@/components/support/SupportLoadError";
import SupportTicketDetailShell from "@/components/support/SupportTicketDetailShell";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import { useAuth } from "@/lib/admin/auth-context";
import { canReviewTicket } from "@/lib/support/roles-shared";
import { useSupportTicketDetail } from "@/hooks/useSupportApi";

export default function ChamadoDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { data, loading, error, refresh } = useSupportTicketDetail(id);
  const { role } = useAuth();
  const [reply, setReply] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [busy, setBusy] = useState(false);

  const ticket = data?.ticket;
  const canReply = ticket && ticket.status !== "encerrado";
  const canReopen = ticket && (ticket.status === "resolvido" || ticket.status === "encerrado");
  const canApprove =
    ticket &&
    ticket.status === "aguardando_aprovacao" &&
    (canReviewTicket(role ?? "") || ticket.openedBy.uid === data?.ticket.openedBy.uid);

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
      toast.error("Não foi possível enviar a mensagem.");
    } finally {
      setBusy(false);
    }
  }

  async function reopen() {
    setBusy(true);
    try {
      const headers = await authorizedHeaders({ "Content-Type": "application/json" });
      const res = await fetch(`/api/support/tickets/${id}/reopen`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason: reopenReason }),
      });
      if (!res.ok) throw new Error();
      toast.success("Chamado reaberto.");
      await refresh();
    } catch {
      toast.error("Falha ao reabrir.");
    } finally {
      setBusy(false);
    }
  }

  async function review(decision: "approved" | "rejected") {
    setBusy(true);
    try {
      const headers = await authorizedHeaders({ "Content-Type": "application/json" });
      const res = await fetch(`/api/support/tickets/${id}/review`, {
        method: "POST",
        headers,
        body: JSON.stringify({ decision, reason: reviewReason }),
      });
      if (!res.ok) throw new Error();
      toast.success(decision === "approved" ? "Aprovado." : "Reprovado.");
      await refresh();
    } catch {
      toast.error("Falha na revisão.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-muted">Carregando...</p>;
  if (error || !ticket || !data) {
    return (
      <SupportLoadError
        message={error ?? "Chamado não encontrado."}
        onRetry={() => void refresh()}
      />
    );
  }

  return (
    <SupportTicketDetailShell
      data={data}
      composer={
        <div className="grid gap-4">
          {canApprove && (
            <div className="radius-surface grid gap-3 border border-[var(--color-border-subtle)] bg-white p-4">
              <p className="text-sm font-medium text-ink">Revisão da correção</p>
              <textarea
                className={fieldClass}
                rows={2}
                placeholder="Motivo (obrigatório ao reprovar)"
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="button" disabled={busy} onClick={() => void review("approved")}>
                  Aprovar
                </PrimaryButton>
                <button
                  type="button"
                  className="btn-secondary radius-control border border-leaf px-4 py-2 text-sm text-teal"
                  disabled={busy}
                  onClick={() => void review("rejected")}
                >
                  Reprovar
                </button>
              </div>
            </div>
          )}
          {canReply && (
            <div className="grid gap-2">
              <textarea
                className={fieldClass}
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Sua resposta"
              />
              <PrimaryButton type="button" disabled={busy} onClick={() => void postReply()}>
                Enviar resposta
              </PrimaryButton>
            </div>
          )}
          {canReopen && (
            <div className="grid gap-2">
              <textarea
                className={fieldClass}
                rows={2}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Motivo da reabertura"
              />
              <button
                type="button"
                className="btn-secondary radius-control border border-leaf px-4 py-2 text-sm text-teal"
                disabled={busy}
                onClick={() => void reopen()}
              >
                Reabrir chamado
              </button>
            </div>
          )}
        </div>
      }
    />
  );
}
