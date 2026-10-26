"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import { Card, PageTitle } from "@/components/admin/ui";
import { useWorkspace } from "@/lib/team/workspace-context";
import type { ClinicAccount } from "@/lib/team/types";
import { formatDate, formatMoney } from "@/lib/admin/format";

type Consolidated = {
  agenda: { id: string; ownerUid: string; date: string; startTime: string; status: string }[];
  financeiro: { id: string; ownerUid: string; descricao: string; dueDate: string; valor: number; status: string }[];
};

export default function EquipeClinicaPage() {
  const { workspace } = useWorkspace();
  const [clinic, setClinic] = useState<ClinicAccount | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [consolidated, setConsolidated] = useState<Consolidated | null>(null);

  const isAdmin = workspace?.clinicRole === "admin" || workspace?.kind === "owner";

  useEffect(() => {
    authorizedHeaders()
      .then((headers) => fetch("/api/team/clinic", { headers }))
      .then((response) => response.json())
      .then((data) => {
        setClinic(data.clinic as ClinicAccount | null);
        setNome(String(data.clinic?.nome || ""));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    authorizedHeaders()
      .then((headers) => fetch("/api/team/clinic/consolidated", { headers }))
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setConsolidated(data))
      .catch(() => undefined);
  }, [isAdmin]);

  async function saveClinicName() {
    const headers = await authorizedHeaders({ "Content-Type": "application/json" });
    const response = await fetch("/api/team/clinic", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ nome }),
    });
    if (!response.ok) {
      toast.error("Não foi possível salvar.");
      return;
    }
    toast.success("Nome da clínica atualizado.");
  }

  async function inviteProfessional() {
    if (!clinic?.id || !email.trim()) return;
    const headers = await authorizedHeaders({ "Content-Type": "application/json" });
    const response = await fetch("/api/team/clinic/invite", {
      method: "POST",
      headers,
      body: JSON.stringify({ clinicId: clinic.id, inviteeEmail: email, inviterNome: "Administrador" }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Erro ao convidar.");
      return;
    }
    toast.success(`Convite criado: ${data.link}`);
    setEmail("");
  }

  const totalReceber = consolidated?.financeiro.reduce((sum, item) => sum + (Number(item.valor) || 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageTitle title="Clínica" subtitle="Vários profissionais, agenda e financeiro consolidados, prontuário isolado." />
      {isAdmin ? (
        <>
          <Card className="space-y-3 p-4">
            <h2 className="text-sm font-semibold text-ink">Dados da clínica</h2>
            <input
              className="w-full rounded-control border border-[var(--color-border-subtle)] px-3 py-2 text-sm"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
            />
            <button type="button" className="btn-primary" onClick={saveClinicName}>
              Salvar nome
            </button>
          </Card>
          <Card className="space-y-3 p-4">
            <h2 className="text-sm font-semibold text-ink">Convidar psicólogo(a)</h2>
            <input
              className="w-full rounded-control border border-[var(--color-border-subtle)] px-3 py-2 text-sm"
              placeholder="E-mail do profissional"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="button" className="btn-text" onClick={inviteProfessional}>
              Enviar convite
            </button>
            <p className="text-xs text-muted">Membros: {(clinic?.memberUids || []).length + 1} profissionais (inclui admin).</p>
          </Card>
          <Card className="space-y-4 p-4">
            <h2 className="text-sm font-semibold text-ink">Agenda consolidada (janela atual)</h2>
            <ul className="space-y-2 text-sm">
              {(consolidated?.agenda || []).slice(0, 12).map((item) => (
                <li key={item.id} className="flex justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-2">
                  <span>{formatDate(item.date)} · {item.startTime}</span>
                  <span className="text-muted">{item.status}</span>
                </li>
              ))}
              {!consolidated?.agenda?.length ? <li className="text-muted">Nenhuma sessão na janela.</li> : null}
            </ul>
          </Card>
          <Card className="space-y-3 p-4">
            <h2 className="text-sm font-semibold text-ink">Financeiro consolidado</h2>
            <p className="text-sm text-muted">Total listado: {formatMoney(totalReceber)}</p>
            <ul className="space-y-2 text-sm">
              {(consolidated?.financeiro || []).slice(0, 10).map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>{item.descricao}</span>
                  <span>{formatMoney(item.valor)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : (
        <Card className="p-4 text-sm text-muted">
          Você participa de uma clínica como profissional. Seus prontuários permanecem privados; o administrador vê apenas agenda e
          financeiro agregados.
        </Card>
      )}
    </div>
  );
}
