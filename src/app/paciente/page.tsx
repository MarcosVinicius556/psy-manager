"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { patientFetch } from "@/lib/patient/api";
import { usePatientAuth } from "@/lib/patient/auth-context";

type Dashboard = {
  nextSession: {
    id: string;
    date: string;
    startTime: string;
    modality: string;
    googleMeetLink: string | null;
  } | null;
  pendingDocuments: number;
  pendingPayments: number;
  cvvNote: string;
};

export default function PatientHomePage() {
  const { profile } = usePatientAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loadError, setLoadError] = useState("");

  const today = useMemo(() => new Date(), []);
  const monthLabel = today.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  useEffect(() => {
    if (!profile?.active) return;
    void patientFetch("/api/patient/dashboard")
      .then(setData)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "erro"));
  }, [profile?.active]);

  if (!profile?.active) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-medium text-teal">Início</h1>
          <Link href="/paciente/conexoes" className="btn-row text-sm">Conexões</Link>
        </div>
        <p className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4 text-sm text-muted">
          {profile?.linked
            ? "Sua conexão atual está desativada ou o portal foi pausado pelo profissional. Ajuste em Minhas conexões."
            : "Conecte-se ao espaço do seu psicólogo(a) com o código de vínculo."}
        </p>
        <Link href="/paciente/conexoes" className="btn-primary inline-block">Ir para Minhas conexões</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-medium text-teal">Início</h1>
        <Link href="/paciente/conexoes" className="btn-row text-sm">Conexões</Link>
      </div>
      <p className="text-sm text-muted capitalize">{monthLabel}</p>
      <section className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4">
        <h2 className="mb-2 font-medium">Hoje</h2>
        <p className="text-sm text-muted">Sem tarefas nesta data.</p>
      </section>
      <p className="text-sm text-muted">{data?.cvvNote}</p>
      {loadError && <p className="text-sm text-accent">{loadError}</p>}
      <section className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4">
        <h2 className="mb-2 font-medium">Próxima sessão</h2>
        {data?.nextSession ? (
          <div className="text-sm">
            <p>{data.nextSession.date} às {data.nextSession.startTime}</p>
            <p className="text-muted">{data.nextSession.modality === "online" ? "Online" : "Presencial"}</p>
            {data.nextSession.googleMeetLink && (
              <a className="btn-text mt-2 inline-block" href={data.nextSession.googleMeetLink} target="_blank" rel="noreferrer">
                Abrir Google Meet
              </a>
            )}
            <Link href="/paciente/sessoes" className="btn-row mt-3 inline-block">Ver sessões</Link>
          </div>
        ) : (
          <p className="text-sm text-muted">Nenhuma sessão agendada.</p>
        )}
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/paciente/documentos" className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4 text-sm hover:border-teal">
          <p className="font-medium">Documentos</p>
          <p className="text-muted">{data?.pendingDocuments ?? 0} pendente(s)</p>
        </Link>
        <Link href="/paciente/pagamentos" className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4 text-sm hover:border-teal">
          <p className="font-medium">Pagamentos</p>
          <p className="text-muted">{data?.pendingPayments ?? 0} em aberto</p>
        </Link>
      </div>
    </div>
  );
}
