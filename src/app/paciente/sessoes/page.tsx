"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { patientFetch } from "@/lib/patient/api";

type Row = {
  id: string;
  date: string;
  startTime: string;
  status: string;
  confirmacao: string;
  googleMeetLink: string | null;
};

export default function PatientSessionsPage() {
  const [items, setItems] = useState<Row[]>([]);

  async function load() {
    const data = await patientFetch("/api/patient/appointments");
    setItems(data.items as Row[]);
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(id: string, action: "confirmar" | "remarcar") {
    try {
      await patientFetch("/api/patient/appointments", {
        method: "PATCH",
        body: JSON.stringify({ appointmentId: id, action }),
      });
      toast.success(action === "confirmar" ? "Sessão confirmada." : "Pedido de remarcação enviado.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar.");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-medium text-teal">Sessões</h1>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4 text-sm">
            <p className="font-medium">{item.date} · {item.startTime}</p>
            <p className="text-muted">Status: {item.status} · Confirmação: {item.confirmacao || "pendente"}</p>
            {item.googleMeetLink && (
              <a className="btn-text mt-2 inline-block" href={item.googleMeetLink} target="_blank" rel="noreferrer">
                Meet
              </a>
            )}
            {item.status === "agendado" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="btn-row" onClick={() => void act(item.id, "confirmar")}>Confirmar</button>
                <button type="button" className="btn-text" onClick={() => void act(item.id, "remarcar")}>Preciso remarcar</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
