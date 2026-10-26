"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import { Card, Empty } from "@/components/admin/ui";

type Summary = {
  totals: {
    missingTcle: number;
    missingContrato: number;
    sessionsWithoutEvolution: number;
    retentionAlerts: number;
  };
  encryptionEnabled: boolean;
  patients: Array<{
    patientId: string;
    nome: string;
    missingTcle: boolean;
    missingContrato: boolean;
    sessionsWithoutEvolution: number;
    inactiveRetentionAlert: boolean;
  }>;
  accessLog: Array<{
    id: string;
    patientId: string;
    accessorLabel: string;
    day: string;
    count: number;
    lastAccessAt: string;
  }>;
};

export default function ConformidadePage() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const headers = await authorizedHeaders();
        const response = await fetch("/api/compliance/summary", { headers });
        if (!response.ok) throw new Error("fail");
        const payload = (await response.json()) as Summary;
        if (active) setData(payload);
      } catch {
        if (active) setError("Não foi possível carregar o painel.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p className="text-muted">Carregando conformidade...</p>;
  if (error || !data) return <p className="text-muted">{error || "Indisponível."}</p>;

  const pendencias = data.patients.filter(
    (item) =>
      item.missingTcle ||
      item.missingContrato ||
      item.sessionsWithoutEvolution > 0 ||
      item.inactiveRetentionAlert
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-teal">Conformidade CFP / LGPD</h1>
        <p className="mt-2 text-sm text-muted">
          Pendências de documentos, evoluções e guarda mínima de 5 anos (CFP 1/2009). Registro de acesso ao prontuário (LGPD art. 37).
        </p>
        {!data.encryptionEnabled ? (
          <p className="mt-2 text-sm text-amber-800">
            Criptografia por campo desativada: defina <code className="text-xs">CLINICAL_FIELD_ENC_KEY</code> no servidor para cifrar prontuários e respostas de formulário.
          </p>
        ) : (
          <p className="mt-2 text-sm text-teal">Criptografia por campo ativa no servidor.</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card><p className="text-sm text-muted">TCLE pendente</p><p className="text-2xl font-medium text-teal">{data.totals.missingTcle}</p></Card>
        <Card><p className="text-sm text-muted">Contrato pendente</p><p className="text-2xl font-medium text-teal">{data.totals.missingContrato}</p></Card>
        <Card><p className="text-sm text-muted">Sessões sem evolução</p><p className="text-2xl font-medium text-teal">{data.totals.sessionsWithoutEvolution}</p></Card>
        <Card><p className="text-sm text-muted">Alertas de guarda (5 anos)</p><p className="text-2xl font-medium text-teal">{data.totals.retentionAlerts}</p></Card>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-medium text-teal">Pendências por paciente</h2>
        {pendencias.length === 0 ? (
          <Empty>Nenhuma pendência encontrada nos dados de demonstração.</Empty>
        ) : (
          <ul className="grid gap-3">
            {pendencias.map((item) => (
              <li key={item.patientId} className="rounded-surface border border-[var(--color-border-subtle)] p-3">
                <Link href={`/admin/pacientes/${item.patientId}`} className="font-medium text-teal">
                  {item.nome}
                </Link>
                <ul className="mt-2 list-disc pl-5 text-sm text-muted">
                  {item.missingTcle ? <li>TCLE não registrado</li> : null}
                  {item.missingContrato ? <li>Contrato não anexado</li> : null}
                  {item.sessionsWithoutEvolution > 0 ? (
                    <li>{item.sessionsWithoutEvolution} sessão(ões) concluída(s) sem evolução</li>
                  ) : null}
                  {item.inactiveRetentionAlert ? <li>Paciente inativo — revisar prazo de guarda</li> : null}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-medium text-teal">Acessos ao prontuário (recentes)</h2>
        {data.accessLog.length === 0 ? (
          <Empty>Nenhum acesso registrado ainda.</Empty>
        ) : (
          <ul className="grid gap-2 text-sm">
            {data.accessLog.map((row) => (
              <li key={row.id} className="flex flex-wrap justify-between gap-2 border-b border-[var(--color-border-subtle)] py-2">
                <span>{row.accessorLabel}</span>
                <span className="text-muted">
                  Paciente {row.patientId} · {row.count} acesso(s) · {row.lastAccessAt.slice(0, 16).replace("T", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
