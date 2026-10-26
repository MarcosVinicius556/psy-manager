"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { SupervisionCasePayload } from "@/lib/team/types";

export default function PublicSupervisaoPage() {
  const params = useParams<{ token: string }>();
  const [payload, setPayload] = useState<SupervisionCasePayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/public/supervisao/${params.token}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Link expirado ou inválido.");
        const data = await response.json();
        setPayload(data.payload as SupervisionCasePayload);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Link indisponível."));
  }, [params.token]);

  if (error) {
    return (
      <main className="mx-auto max-w-2xl p-6 text-sm text-muted">
        <h1 className="text-lg font-semibold text-ink">Supervisão</h1>
        <p className="mt-2">{error}</p>
      </main>
    );
  }

  if (!payload) {
    return <main className="p-6 text-sm text-muted">Carregando caso…</main>;
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-ink">{payload.titulo}</h1>
        <p className="mt-2 text-sm text-muted">{payload.resumo}</p>
      </header>
      <section className="space-y-4">
        {payload.linhaDoTempo.map((item) => (
          <article key={item.relativo} className="rounded-surface border border-[var(--color-border-subtle)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{item.relativo}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{item.texto}</p>
          </article>
        ))}
      </section>
      <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
        {payload.avisos.map((aviso) => (
          <li key={aviso}>{aviso}</li>
        ))}
      </ul>
    </main>
  );
}
