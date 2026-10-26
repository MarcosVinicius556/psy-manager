"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card, Pill } from "@/components/admin/ui";
import { formatDate } from "@/lib/admin/format";
import type { BookingRequest } from "@/lib/booking/types";
import { getFirebaseAuth } from "@/lib/admin/firebase";

export default function BookingRequestsPanel({ highlightId }: { highlightId?: string | null }) {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getFirebaseAuth().currentUser?.getIdToken();
      const response = await fetch("/api/booking/requests?status=pendente", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("load");
      const data = (await response.json()) as { requests: BookingRequest[] };
      setRequests(data.requests);
    } catch {
      toast.error("Não foi possível carregar pedidos de agendamento.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, action: "approve" | "reject") {
    setActing(id);
    try {
      const token = await getFirebaseAuth().currentUser?.getIdToken();
      const response = await fetch(`/api/booking/requests/${id}/${action === "approve" ? "approve" : "reject"}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; appointmentId?: string };
      if (!response.ok) {
        toast.error(
          payload?.error === "horario_indisponivel"
            ? "O horário não está mais livre."
            : "Não foi possível atualizar o pedido."
        );
        void load();
        return;
      }
      toast.success(action === "approve" ? "Sessão criada e paciente notificado por e-mail." : "Pedido recusado.");
      setRequests((current) => current.filter((item) => item.id !== id));
      if (action === "approve" && payload.appointmentId) {
        window.location.href = `/admin/atendimentos/${payload.appointmentId}`;
      }
    } catch {
      toast.error("Não foi possível atualizar o pedido.");
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-muted">Carregando pedidos pelo link público...</p>
      </Card>
    );
  }

  if (!requests.length) return null;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-teal">Pedidos de agendamento</h2>
        <Pill tone="accent">{requests.length} pendente(s)</Pill>
      </div>
      <ul className="mt-4 flex flex-col gap-3">
        {requests.map((item) => {
          const highlighted = highlightId === item.id;
          return (
            <li
              key={item.id}
              className={`rounded-surface border border-[var(--color-border-subtle)] p-4 ${
                highlighted ? "ring-2 ring-teal/30" : ""
              }`}
            >
              <p className="font-semibold text-teal">{item.patientName}</p>
              <p className="text-sm text-muted">
                {formatDate(item.date)} · {item.startTime}–{item.endTime} ·{" "}
                {item.modality === "online" ? "Online" : "Presencial"}
              </p>
              <p className="text-sm text-muted">{item.patientEmail} · {item.patientPhone}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={acting === item.id}
                  className="btn-primary min-h-11 rounded-control px-3 py-2 text-sm font-semibold disabled:opacity-60"
                  onClick={() => void act(item.id, "approve")}
                >
                  Aprovar
                </button>
                <button
                  type="button"
                  disabled={acting === item.id}
                  className="btn-text min-h-11 rounded-control border border-[var(--color-border-subtle)] px-3 py-2 text-sm font-semibold"
                  onClick={() => void act(item.id, "reject")}
                >
                  Recusar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
