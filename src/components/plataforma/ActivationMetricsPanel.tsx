"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, Empty } from "@/components/admin/ui";
import type { ActivationEventRecord } from "@/lib/saas/activation-events";
import { summarizeActivationMetrics } from "@/lib/saas/activation-metrics";
import type { AccountRecord } from "@/lib/saas/model";

type Props = {
  events: ActivationEventRecord[];
  accounts: AccountRecord[];
};

export function ActivationMetricsPanel({ events, accounts }: Props) {
  const now = Date.now();
  const summary = useMemo(() => summarizeActivationMetrics(events, accounts, now), [events, accounts, now]);
  const maxFunnel = Math.max(1, ...summary.funnel.map((step) => step.count));

  return (
    <div className="mt-8 grid gap-4">
      <div>
        <h2 className="text-2xl text-teal">Ativação e trial</h2>
        <p className="mt-1 text-sm text-muted">
          Eventos sem conteúdo clínico (só conta, marco e horário). Contas antigas podem não ter histórico retroativo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Conversão trial → paga</p>
          <p className="mt-2 font-num text-3xl text-teal">
            {summary.trialToPaid.rate == null ? "—" : `${summary.trialToPaid.rate}%`}
          </p>
          <p className="mt-1 text-xs text-muted">
            {summary.trialToPaid.paid} pagas de {summary.trialToPaid.trials} que passaram por avaliação
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Mediana até 1ª sessão concluída</p>
          <p className="mt-2 font-num text-3xl text-teal">
            {summary.medianDaysToFirstSession == null ? "—" : `${summary.medianDaysToFirstSession.toFixed(1)} d`}
          </p>
          <p className="mt-1 text-xs text-muted">Entre cadastro e evento de sessão concluída</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Contas em risco (trial ≤ 7 dias)</p>
          <p className="mt-2 font-num text-3xl text-teal">{summary.atRisk.length}</p>
          <p className="mt-1 text-xs text-muted">Baixa ativação ou trial perto do fim</p>
        </Card>
      </div>

      <Card>
        <h3 className="text-xl text-teal">Funil de ativação</h3>
        <ul className="mt-4 grid gap-3">
          {summary.funnel.map((step) => (
            <li key={step.event} className="grid gap-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-ink">{step.label}</span>
                <span className="font-num text-teal">{step.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-paper">
                <div className="h-full rounded-full bg-teal" style={{ width: `${Math.max(4, (step.count / maxFunnel) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h3 className="text-xl text-teal">Contas em risco</h3>
        {summary.atRisk.length === 0 ? (
          <div className="mt-3">
            <Empty>Nenhuma conta trial crítica neste recorte.</Empty>
          </div>
        ) : (
          <ul className="mt-4 grid gap-2">
            {summary.atRisk.slice(0, 12).map((item) => (
              <li key={item.uid} className="rounded-md bg-paper px-3 py-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link href={`/plataforma/contas/${item.uid}`} className="font-medium text-teal">
                    {item.nome}
                  </Link>
                  <span className="text-xs text-muted">
                    {item.trialDaysLeft === 1 ? "1 dia restante" : `${item.trialDaysLeft} dias restantes`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted break-all [overflow-wrap:anywhere]">{item.email}</p>
                <p className="mt-1 text-xs text-accent">{item.reasons.join(" · ")}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
