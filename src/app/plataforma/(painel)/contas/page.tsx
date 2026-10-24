"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DataTable, Empty, PageTitle, Pill, Td, Th } from "@/components/admin/ui";
import { ACCOUNT_LABEL, matchesAccountFilter, STATUS_LABEL, type AccountRecord } from "@/lib/saas/model";
import { listManagedAccounts } from "@/lib/saas/platform-store";

const filters = [
  ["todos", "Todos"],
  ["trials_ativos", "Trials ativos"],
  ["trials_expirados", "Trials expirados"],
  ["pagantes", "Pagantes"],
  ["pagamento", "Pagamento em aberto"],
  ["canceladas", "Canceladas"],
  ["suspensas", "Suspensas ou inativas"],
] as const;

const PAGE = 20;

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [filter, setFilter] = useState<(typeof filters)[number][0]>("todos");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listManagedAccounts()
      .then(setAccounts)
      .catch(() => setError("Não foi possível listar as contas."))
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return accounts.filter((account) => {
      if (!matchesAccountFilter(account, filter, now)) return false;
      if (!term) return true;
      return [account.nome, account.email, account.clinicName].some((value) => value.toLowerCase().includes(term));
    });
  }, [accounts, filter, now, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const visible = filtered.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <div>
      <PageTitle title="Contas" subtitle="Profissionais e consultórios. A lista não inclui prontuário, evolução ou anexos clínicos." />
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map(([id, label]) => (
          <button key={id} type="button" className={filter === id ? "btn-chip-active" : "btn-chip"} onClick={() => { setFilter(id); setPage(0); }}>{label}</button>
        ))}
      </div>
      <label className="mb-4 block max-w-md text-sm font-medium" htmlFor="busca">Buscar</label>
      <input id="busca" className="mb-4 w-full max-w-md rounded-md border border-[#e2e8ea] px-4 py-3 text-sm" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Nome, e-mail ou consultório" />
      {loading && <p className="text-muted">Carregando contas...</p>}
      {error && <p className="text-accent">{error}</p>}
      {!loading && visible.length === 0 && <Empty>Nenhuma conta neste filtro.</Empty>}
      {visible.length > 0 && (
        <DataTable minWidth={980}>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>E-mail</Th>
              <Th>Consultório</Th>
              <Th>Cadastro</Th>
              <Th>Último acesso</Th>
              <Th>Plano</Th>
              <Th>Trial</Th>
              <Th>Assinatura</Th>
              <Th>Conta</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((account) => (
              <tr key={account.uid}>
                <Td><Link href={`/plataforma/contas/${account.uid}`} className="font-semibold text-teal">{account.nome || "Sem nome"}</Link></Td>
                <Td>{account.email}</Td>
                <Td>{account.clinicName || "—"}</Td>
                <Td>{account.createdAt ? new Date(account.createdAt).toLocaleDateString("pt-BR") : "—"}</Td>
                <Td>{account.lastSeenAt ? new Date(account.lastSeenAt).toLocaleString("pt-BR") : "—"}</Td>
                <Td>{account.planId || "—"}</Td>
                <Td>{account.trialEndsAt ? new Date(account.trialEndsAt).toLocaleDateString("pt-BR") : "—"}</Td>
                <Td><Pill tone={account.subscriptionStatus === "ativa" ? "teal" : account.subscriptionStatus === "trial_ativo" ? "sage" : "muted"}>{account.subscriptionStatus ? STATUS_LABEL[account.subscriptionStatus] : "—"}</Pill></Td>
                <Td>{account.accountStatus ? ACCOUNT_LABEL[account.accountStatus] : "—"}</Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
      {pages > 1 && (
        <div className="mt-4 flex items-center gap-3 text-sm">
          <button type="button" className="btn-text" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>Anterior</button>
          <span className="text-muted">Página {page + 1} de {pages}</span>
          <button type="button" className="btn-text" disabled={page + 1 >= pages} onClick={() => setPage((current) => current + 1)}>Próxima</button>
        </div>
      )}
    </div>
  );
}
