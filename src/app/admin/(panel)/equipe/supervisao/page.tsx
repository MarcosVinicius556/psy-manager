"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import { useClinic } from "@/lib/admin/clinic-context";
import { Card, PageTitle } from "@/components/admin/ui";
import { useWorkspace } from "@/lib/team/workspace-context";

export default function SupervisaoPage() {
  const { patients } = useClinic();
  const { workspace } = useWorkspace();
  const [patientId, setPatientId] = useState("");
  const [titulo, setTitulo] = useState("Caso para supervisão");
  const [confirmed, setConfirmed] = useState(false);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  if (!workspace?.isClinicalAllowed) {
    return <PageTitle title="Supervisão" subtitle="Disponível apenas para o profissional responsável." />;
  }

  async function generate() {
    if (!patientId) {
      toast.error("Selecione um paciente.");
      return;
    }
    if (!confirmed) {
      toast.error("Confirme a revisão manual do texto anonimizado.");
      return;
    }
    setBusy(true);
    try {
      const headers = await authorizedHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/team/supervision", {
        method: "POST",
        headers,
        body: JSON.stringify({ patientId, titulo, reviewerConfirmed: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível gerar o link.");
      setLink(data.link);
      toast.success("Link criado com validade limitada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao exportar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Supervisão" subtitle="Compartilhe um caso sem identificadores, após revisão manual." />
      <Card className="space-y-4 p-4">
        <label className="block text-sm font-medium text-ink">
          Paciente
          <select
            className="mt-1 w-full rounded-control border border-[var(--color-border-subtle)] px-3 py-2 text-sm"
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
          >
            <option value="">Selecione…</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-ink">
          Título interno
          <input
            className="mt-1 w-full rounded-control border border-[var(--color-border-subtle)] px-3 py-2 text-sm"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
          />
        </label>
        <label className="flex items-start gap-2 text-sm text-muted">
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
          Revisei o conteúdo e confirmo que não há nomes, CPF ou contatos no material exportado.
        </label>
        <button type="button" className="btn-primary" disabled={busy} onClick={generate}>
          {busy ? "Gerando…" : "Gerar link temporário"}
        </button>
        {link ? (
          <p className="text-sm break-all text-ink">
            Link:{" "}
            <a href={link} className="underline" target="_blank" rel="noreferrer">
              {link}
            </a>
          </p>
        ) : null}
      </Card>
    </div>
  );
}
