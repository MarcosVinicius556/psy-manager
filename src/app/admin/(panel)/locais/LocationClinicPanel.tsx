"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import { useAuth } from "@/lib/admin/auth-context";
import { Card } from "@/components/admin/ui";
import { formatDate, formatMoney } from "@/lib/admin/format";
import type { CareLocation } from "@/lib/admin/types";

type Consolidated = {
  agenda: { id: string; ownerUid: string; date: string; startTime: string; status: string }[];
  financeiro: { id: string; ownerUid: string; descricao: string; dueDate: string; valor: number; status: string }[];
};

export default function LocationClinicPanel({ location }: { location: CareLocation }) {
  const { user } = useAuth();
  const owner = location.createdByUid === user?.uid;
  const [email, setEmail] = useState("");
  const [consolidated, setConsolidated] = useState<Consolidated | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!owner) return;
    authorizedHeaders()
      .then((headers) => fetch(`/api/team/clinic/consolidated?locationId=${encodeURIComponent(location.id)}`, { headers }))
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setConsolidated(data))
      .catch(() => undefined);
  }, [location.id, owner]);

  async function inviteByEmail() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const headers = await authorizedHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/team/clinic/invite", {
        method: "POST",
        headers,
        body: JSON.stringify({
          locationId: location.id,
          inviteeEmail: email.trim(),
          inviterNome: "Administrador",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.reason || "Erro ao convidar.");
      toast.success("Convite enviado por e-mail.");
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o convite.");
    } finally {
      setLoading(false);
    }
  }

  if (!owner) {
    return (
      <Card className="mt-6 p-4 text-sm text-muted">
        Você participa deste local como profissional. Seus prontuários permanecem privados; quem administra o local vê agenda e
        financeiro agregados dos participantes.
      </Card>
    );
  }

  const totalReceber = consolidated?.financeiro.reduce((sum, item) => sum + (Number(item.valor) || 0), 0) ?? 0;
  const professionals = [location.createdByUid, ...location.memberUids].filter(Boolean).length;

  return (
    <div className="mt-6 space-y-4">
      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold text-ink">Equipe do local</h2>
        <p className="text-sm text-muted">
          {professionals} profissional(is) neste local. Use &quot;Compartilhar&quot; acima para convidar quem já está na plataforma ou envie
          convite por e-mail abaixo.
        </p>
        <input
          className="w-full rounded-control border border-[var(--color-border-subtle)] px-3 py-2 text-sm"
          placeholder="E-mail do(a) psicólogo(a)"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button type="button" className="btn-text" disabled={loading} onClick={inviteByEmail}>
          {loading ? "Enviando…" : "Convidar por e-mail"}
        </button>
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
          {!consolidated?.agenda?.length ? <li className="text-muted">Nenhuma sessão neste local na janela.</li> : null}
        </ul>
      </Card>
      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold text-ink">Financeiro consolidado</h2>
        <p className="text-sm text-muted">Total listado (profissionais do local): {formatMoney(totalReceber)}</p>
        <ul className="space-y-2 text-sm">
          {(consolidated?.financeiro || []).slice(0, 10).map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>{item.descricao}</span>
              <span>{formatMoney(item.valor)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
