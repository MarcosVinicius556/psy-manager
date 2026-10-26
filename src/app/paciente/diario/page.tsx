"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { patientFetch } from "@/lib/patient/api";

function todayBrasilia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

const MOODS = [
  { id: "calma", label: "Calma" },
  { id: "estavel", label: "Estável" },
  { id: "ansioso", label: "Ansioso(a)" },
  { id: "triste", label: "Triste" },
  { id: "irritado", label: "Irritado(a)" },
];

export default function PatientJournalPage() {
  const [humor, setHumor] = useState("");
  const [texto, setTexto] = useState("");
  const [compartilhado, setCompartilhado] = useState(true);
  const [entries, setEntries] = useState<{ dia: string; humor: string; texto: string; compartilhado: boolean }[]>([]);

  async function load() {
    const data = await patientFetch("/api/patient/journal");
    setEntries(data.items as typeof entries);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    try {
      await patientFetch("/api/patient/journal", {
        method: "POST",
        body: JSON.stringify({ dia: todayBrasilia(), humor, texto, compartilhado }),
      });
      toast.success("Registro salvo.");
      setTexto("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar.");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-medium text-teal">Diário de humor</h1>
      <p className="text-sm text-muted">Um check-in por dia. Você escolhe o que compartilhar com o profissional.</p>
      <div className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4 space-y-3">
        <label className="block text-sm">
          Como você está hoje?
          <select className="field mt-1 w-full" value={humor} onChange={(e) => setHumor(e.target.value)}>
            <option value="">Selecione</option>
            {MOODS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </label>
        <textarea className="field w-full min-h-24" placeholder="Opcional: escreva o que quiser registrar" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={compartilhado} onChange={(e) => setCompartilhado(e.target.checked)} />
          Compartilhar com meu psicólogo(a)
        </label>
        <button type="button" className="btn-primary" onClick={() => void save()}>Salvar hoje</button>
      </div>
      <ul className="space-y-2 text-sm">
        {entries.map((entry) => (
          <li key={entry.dia} className="rounded-surface border border-[var(--color-border-subtle)] p-3">
            <p className="font-medium">{entry.dia} · {entry.humor || "—"}</p>
            <p className="text-muted">{entry.texto || "—"}</p>
            {!entry.compartilhado && <p className="text-xs text-muted">Somente você</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
