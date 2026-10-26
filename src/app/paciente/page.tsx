"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { patientFetch } from "@/lib/patient/api";

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
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    void patientFetch("/api/patient/dashboard").then(setData);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-medium text-teal">Início</h1>
      <p className="text-sm text-muted">{data?.cvvNote}</p>
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
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/paciente/diario" className="btn-text text-center">Diário de humor</Link>
        <Link href="/paciente/tarefas" className="btn-text text-center">Tarefas</Link>
      </div>
    </div>
  );
}
