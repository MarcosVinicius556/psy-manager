"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import type { Appointment, Patient } from "@/lib/admin/types";

type FormResponseItem = {
  id: string;
  templateId: string;
  templateVersion: number;
  submittedAt: string;
  respostas: Record<string, string>;
};

export default function FormResponsesPanel({
  patient,
  appointments,
}: {
  patient: Patient;
  appointments: Appointment[];
}) {
  const [items, setItems] = useState<FormResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointmentId, setAppointmentId] = useState("");
  const concluded = appointments.filter((item) => item.status === "concluido" || item.status === "em_andamento");

  useEffect(() => {
    if (!appointmentId && concluded[0]) setAppointmentId(concluded[0].id);
  }, [appointmentId, concluded]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const headers = await authorizedHeaders();
        const response = await fetch(`/api/form-responses?patientId=${encodeURIComponent(patient.id)}`, { headers });
        if (!response.ok) throw new Error("fail");
        const payload = (await response.json()) as { items: FormResponseItem[] };
        if (active) setItems(payload.items);
      } catch {
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [patient.id]);

  async function applyToRecord(responseId: string) {
    if (!appointmentId) {
      toast.error("Escolha uma sessão.");
      return;
    }
    try {
      const headers = await authorizedHeaders({ "Content-Type": "application/json" });
      const response = await fetch(`/api/form-responses/${encodeURIComponent(responseId)}/apply`, {
        method: "POST",
        headers,
        body: JSON.stringify({ appointmentId }),
      });
      if (!response.ok) throw new Error("fail");
      toast.success("Respostas copiadas para o prontuário da sessão.");
    } catch {
      toast.error("Não foi possível aplicar no prontuário.");
    }
  }

  if (loading) return <p className="text-sm text-muted">Carregando respostas...</p>;
  if (items.length === 0) return <p className="text-sm text-muted">Nenhuma resposta de formulário ainda.</p>;

  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm">
        Sessão de destino
        <select
          className="rounded-control border border-[var(--color-border-subtle)] bg-paper px-3 py-2"
          value={appointmentId}
          onChange={(e) => setAppointmentId(e.target.value)}
        >
          {concluded.map((item) => (
            <option key={item.id} value={item.id}>
              {item.date} {item.startTime}
            </option>
          ))}
        </select>
      </label>
      <ul className="grid gap-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-surface border border-[var(--color-border-subtle)] p-3 text-sm">
            <p className="font-medium text-ink">{item.templateId} · v{item.templateVersion}</p>
            <p className="text-muted">{item.submittedAt.slice(0, 16).replace("T", " ")}</p>
            <button type="button" className="btn-row mt-2 min-h-10" onClick={() => void applyToRecord(item.id)}>
              Usar no prontuário
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
