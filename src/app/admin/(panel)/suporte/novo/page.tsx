"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { PageTitle, PrimaryButton, fieldClass } from "@/components/admin/ui";
import SupportEvidenceUpload from "@/components/support/SupportEvidenceUpload";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import type { SupportAttachmentMeta } from "@/lib/support/types";

export default function NovoChamadoPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [impact, setImpact] = useState("");
  const [ticketId, setTicketId] = useState<string | undefined>();
  const [pendingAttachments, setPendingAttachments] = useState<SupportAttachmentMeta[]>([]);
  const [busy, setBusy] = useState(false);

  async function ensureTicket() {
    if (ticketId) return ticketId;
    if (!title.trim() || !description.trim()) {
      toast.warn("Informe título e descrição antes dos anexos.");
      return undefined;
    }
    const headers = await authorizedHeaders({ "Content-Type": "application/json" });
    const res = await fetch("/api/support/tickets", {
      method: "POST",
      headers,
      body: JSON.stringify({ title, description, extraInfo, impact, attachments: [] }),
    });
    if (!res.ok) throw new Error("Não foi possível abrir o chamado");
    const data = await res.json();
    setTicketId(data.id);
    return data.id as string;
  }

  async function submit() {
    if (!title.trim() || !description.trim()) {
      toast.warn("Informe título e descrição.");
      return;
    }
    setBusy(true);
    try {
      const id = ticketId ?? (await ensureTicket());
      if (!id) return;
      if (pendingAttachments.length) {
        const headers = await authorizedHeaders({ "Content-Type": "application/json" });
        await fetch(`/api/support/tickets/${id}/attachments`, {
          method: "POST",
          headers,
          body: JSON.stringify({ attachments: pendingAttachments }),
        });
      }
      toast.success("Chamado registrado.");
      router.push(`/admin/suporte/${id}`);
    } catch {
      toast.error("Falha ao abrir chamado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid max-w-2xl gap-4">
      <PageTitle title="Novo chamado" subtitle="Descreva o problema com o máximo de detalhes." />
      <label className="grid gap-1 text-sm">
        Título
        <input
          className={fieldClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          aria-label="Título"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Descrição
        <textarea
          className={fieldClass}
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Descrição"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Informações adicionais
        <textarea className={fieldClass} rows={3} value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)} />
      </label>
      <label className="grid gap-1 text-sm">
        Impacto no atendimento
        <input className={fieldClass} value={impact} onChange={(e) => setImpact(e.target.value)} />
      </label>
      <SupportEvidenceUpload
        ticketId={ticketId}
        onUploaded={(items) => {
          setPendingAttachments((prev) => [...prev, ...items]);
          void ensureTicket().catch(() => undefined);
        }}
      />
      {pendingAttachments.length > 0 && (
        <ul className="text-sm text-muted">
          {pendingAttachments.map((a) => (
            <li key={a.id}>{a.nome}</li>
          ))}
        </ul>
      )}
      <PrimaryButton type="button" disabled={busy} onClick={() => void submit()}>
        {busy ? "Enviando..." : "Abrir chamado"}
      </PrimaryButton>
    </div>
  );
}
