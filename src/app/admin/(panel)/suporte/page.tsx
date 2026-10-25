"use client";

import Link from "next/link";
import { HiOutlinePlus } from "react-icons/hi";
import ListCard from "@/components/admin/mobile/ListCard";
import { PageTitle } from "@/components/admin/ui";
import SupportStatusBadge from "@/components/support/SupportStatusBadge";
import { useMySupportTickets } from "@/hooks/useSupportApi";
import { PRIORITY_LABELS } from "@/lib/support/labels";

export default function SuportePage() {
  const { tickets, loading, error } = useMySupportTickets();

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle title="Suporte" subtitle="Acompanhe seus chamados e solicite ajuda." />
        <Link href="/admin/suporte/novo" className="btn-primary radius-control inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium">
          <HiOutlinePlus size={18} /> Novo chamado
        </Link>
      </div>
      {loading && <p className="text-sm text-muted">Carregando...</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="grid gap-3">
        {tickets.map((ticket) => (
          <ListCard
            key={ticket.id}
            href={`/admin/suporte/${ticket.id}`}
            title={ticket.humanId}
            subtitle={ticket.title}
            meta={<SupportStatusBadge status={ticket.status} />}
            trailing={<span className="text-xs text-muted">{PRIORITY_LABELS[ticket.priority]}</span>}
          />
        ))}
        {!loading && tickets.length === 0 && (
          <p className="rounded-[var(--radius-surface)] border border-[#e7eee8] bg-white px-4 py-6 text-center text-sm text-muted">
            Você ainda não abriu chamados. Use &quot;Novo chamado&quot; para falar com o suporte.
          </p>
        )}
      </div>
    </div>
  );
}
