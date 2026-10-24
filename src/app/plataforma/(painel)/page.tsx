"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Empty, PageTitle } from "@/components/admin/ui";
import { formatPrice, signupBuckets, summarizeAccounts, type AccountRecord, type PlanDefinition } from "@/lib/saas/model";
import { listManagedAccounts, loadRemotePlans } from "@/lib/saas/platform-store";

const periods = [
  { id: "7", label: "7 dias", days: 7 },
  { id: "30", label: "30 dias", days: 30 },
  { id: "90", label: "90 dias", days: 90 },
  { id: "tudo", label: "Tudo", days: null },
];

export default function PlatformHomePage() {
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([listManagedAccounts(), loadRemotePlans()])
      .then(([nextAccounts, nextPlans]) => {
        setAccounts(nextAccounts);
        setPlans(nextPlans);
      })
      .catch(() => setError("Não foi possível ler os indicadores."))
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();
  const selected = periods.find((item) => item.id === period) ?? periods[1];
  const start = selected.days == null ? null : now - selected.days * 24 * 60 * 60 * 1000;
  const metrics = useMemo(() => summarizeAccounts(accounts, plans, now, start), [accounts, plans, now, start]);
  const bars = signupBuckets(accounts, now, selected.days && selected.days < 30 ? selected.days : 14);
  const max = Math.max(1, ...bars.map((bar) => bar.total));

  return (
    <div>
      <PageTitle title="Indicadores" subtitle="Números das contas. Receita só entra quando existe preço definido e assinatura marcada como paga — hoje isso não é simulado." />
      <div className="mb-4 flex flex-wrap gap-2">
        {periods.map((item) => (
          <button key={item.id} type="button" className={item.id === period ? "btn-chip-active" : "btn-chip"} onClick={() => setPeriod(item.id)}>{item.label}</button>
        ))}
      </div>
      {loading && <p className="text-muted">Carregando indicadores...</p>}
      {error && <p className="text-accent">{error}</p>}
      {!loading && !error && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Contas" value={String(metrics.total)} />
            <Metric label="Novas no período" value={String(metrics.novosNoPeriodo)} />
            <Metric label="Trials ativos" value={String(metrics.trialsAtivos)} />
            <Metric label="Trials a vencer em 7 dias" value={String(metrics.trialsPerto)} />
            <Metric label="Trials expirados" value={String(metrics.trialsExpirados)} />
            <Metric label="Assinaturas pagas" value={String(metrics.ativas)} />
            <Metric label="Checkouts sem pagamento" value={String(metrics.checkoutsAbertos)} />
            <Metric label="Canceladas ou encerradas" value={String(metrics.canceladas)} />
            <Metric label="Suspensas" value={String(metrics.suspensas)} />
            <Metric label="Desativadas" value={String(metrics.desativadas)} />
            <Metric label="Contas anteriores" value={String(metrics.legado)} />
            <Metric label="Cortesias" value={String(metrics.cortesias)} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="text-2xl text-teal">Cadastros recentes</h2>
              <div className="mt-6 flex h-36 items-end gap-1">
                {bars.map((bar) => (
                  <div key={bar.key} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-sm bg-teal" style={{ height: `${Math.max(4, (bar.total / max) * 112)}px` }} title={`${bar.total} em ${bar.label}`} />
                    <span className="text-[10px] text-muted">{bar.label}</span>
                  </div>
                ))}
              </div>
              {bars.every((bar) => bar.total === 0) && <p className="mt-3 text-sm text-muted">Nenhum cadastro com data neste recorte.</p>}
            </Card>
            <Card>
              <h2 className="text-2xl text-teal">Receita</h2>
              <p className="mt-3 text-sm text-muted">Valor contratado mensal, só de assinaturas com estado “ativa” e preço publicado: {formatPrice(metrics.contratadoCentavos)}.</p>
              <p className="mt-2 text-sm text-muted">Pagamentos confirmados pelo provedor: {formatPrice(metrics.recebidoCentavos)}. O zero é real — não há integração recebendo cobrança.</p>
              <p className="mt-2 text-sm text-muted">Assinaturas ativas sem preço: {metrics.ativasSemPreco}. Conversões confirmadas: {metrics.conversoesConfirmadas} de {metrics.coorteTrial} contas que passaram por avaliação.</p>
              <p className="mt-2 text-sm text-muted">Cortesia e conta anterior não entram como receita.</p>
            </Card>
          </div>
          {metrics.total === 0 && <div className="mt-4"><Empty>Ainda não há contas de profissionais para acompanhar.</Empty></div>}
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-num text-3xl text-teal">{value}</p>
    </Card>
  );
}
