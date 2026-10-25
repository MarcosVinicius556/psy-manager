"use client";

import Link from "next/link";
import { HiOutlinePlus } from "react-icons/hi";
import { Empty, PageTitle } from "@/components/admin/ui";
import SupportLoadError from "@/components/support/SupportLoadError";
import SupportTicketListCard from "@/components/support/SupportTicketListCard";
import { useMySupportTickets } from "@/hooks/useSupportApi";

export default function SuportePage() {
  const { tickets, loading, error, refresh } = useMySupportTickets();

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle title="Suporte" subtitle="Acompanhe seus chamados e solicite ajuda." />
        <Link
          href="/admin/suporte/novo"
          className="btn-primary radius-control inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
        >
          <HiOutlinePlus size={18} /> Novo chamado
        </Link>
      </div>
      {loading && <p className="text-sm text-muted">Carregando...</p>}
      {error && !loading ? <SupportLoadError message={error} onRetry={() => void refresh()} /> : null}
      <div className="grid gap-3">
        {tickets.map((ticket) => (
          <SupportTicketListCard key={ticket.id} ticket={ticket} href={`/admin/suporte/${ticket.id}`} />
        ))}
        {!loading && !error && tickets.length === 0 && (
          <div data-testid="support-empty-state">
            <Empty>Você ainda não abriu chamados. Use &quot;Novo chamado&quot; para falar com o suporte.</Empty>
          </div>
        )}
      </div>
    </div>
  );
}
