"use client";

import { useMemo, useState } from "react";
import { PageTitle, fieldClass } from "@/components/admin/ui";
import SupportLoadError from "@/components/support/SupportLoadError";
import SupportTicketListCard from "@/components/support/SupportTicketListCard";
import { useAdminSupportTickets } from "@/hooks/useSupportApi";

export default function PlataformaSuportePage() {
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    return params.toString();
  }, [status, priority]);
  const { tickets, loading, error, refresh } = useAdminSupportTickets(query);

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
      {error && !loading ? <SupportLoadError message={error} onRetry={() => void refresh()} /> : null}
      <div className="grid gap-3">
        {tickets.map((ticket) => (
          <SupportTicketListCard
            key={ticket.id}
            ticket={ticket}
            href={`/plataforma/suporte/${ticket.id}`}
            openedByLine={`${ticket.openedBy.name} · ${ticket.openedBy.email}`}
          />
        ))}
      </div>
      {!loading && !error && tickets.length === 0 && (
        <p className="text-sm text-muted">Nenhum chamado encontrado com os filtros atuais.</p>
      )}
    </div>
  );
}
