"use client";

import { useMemo, useState } from "react";
import ListCard from "@/components/admin/mobile/ListCard";
import { PageTitle, fieldClass } from "@/components/admin/ui";
import SupportStatusBadge from "@/components/support/SupportStatusBadge";
import { useAdminSupportTickets } from "@/hooks/useSupportApi";
import { PRIORITY_LABELS } from "@/lib/support/labels";

export default function PlataformaSuportePage() {
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    return params.toString();
  }, [status, priority]);
  const { tickets, loading } = useAdminSupportTickets(query);

  return (
    <div className="grid gap-4">
      <PageTitle title="Suporte" subtitle="Chamados da plataforma — triagem e acompanhamento." />
      <div className="flex flex-wrap gap-3">
        <select className={fieldClass} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Todos os status</option>
          <option value="aberto">Aberto</option>
          <option value="em_analise">Em análise</option>
          <option value="aguardando_informacoes">Aguardando informações</option>
          <option value="em_desenvolvimento">Em desenvolvimento</option>
          <option value="aguardando_aprovacao">Aguardando aprovação</option>
        </select>
        <select className={fieldClass} value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Prioridade">
          <option value="">Todas as prioridades</option>
          <option value="urgente">Urgente</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </select>
      </div>
      {loading && <p className="text-sm text-muted">Carregando...</p>}
      <div className="grid gap-3">
        {tickets.map((ticket) => (
          <ListCard
            key={ticket.id}
            href={`/plataforma/suporte/${ticket.id}`}
            title={`${ticket.humanId} · ${ticket.openedBy.name}`}
            subtitle={ticket.title}
            meta={<SupportStatusBadge status={ticket.status} />}
            trailing={
              <div className="grid gap-1 text-right text-xs text-muted">
                <span>{PRIORITY_LABELS[ticket.priority]}</span>
                {ticket.badges?.stalled && <span className="text-amber-700">Parado</span>}
                {ticket.badges?.botFailed && <span className="text-red-700">Bot falhou</span>}
                {ticket.badges?.waitingHuman && <span className="text-violet-700">Aguardando humano</span>}
              </div>
            }
          />
        ))}
      </div>
      {!loading && tickets.length === 0 && (
        <p className="text-sm text-muted">Nenhum chamado encontrado com os filtros atuais.</p>
      )}
    </div>
  );
}
