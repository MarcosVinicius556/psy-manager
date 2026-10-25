"use client";

import { useCallback, useEffect, useState } from "react";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import type { SupportTicketMessage, SupportTicketRecord } from "@/lib/support/types";
import type { SupportHistoryEvent } from "@/lib/support/types";
import type { SupportBotExecution } from "@/lib/support/types";

export function useMySupportTickets() {
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await authorizedHeaders();
      const res = await fetch("/api/support/tickets", { headers });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { reason?: string } | null;
        throw new Error(payload?.reason === "erro_listagem" ? "Falha ao carregar chamados" : "Falha ao carregar chamados");
      }
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { tickets, loading, error, refresh };
}

export type TicketDetailPayload = {
  ticket: SupportTicketRecord;
  messages: SupportTicketMessage[];
  history: SupportHistoryEvent[];
  executions: SupportBotExecution[];
  signedAttachments: { id: string; url: string; nome: string; mime: string }[];
};

export function useSupportTicketDetail(id: string) {
  const [data, setData] = useState<TicketDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await authorizedHeaders();
      const res = await fetch(`/api/support/tickets/${id}`, { headers });
      if (!res.ok) throw new Error("Chamado não encontrado");
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useAdminSupportTickets(query: string) {
  const [tickets, setTickets] = useState<(SupportTicketRecord & { badges?: Record<string, boolean> })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await authorizedHeaders();
      const res = await fetch(`/api/support/admin/tickets?${query}`, { headers });
      if (!res.ok) throw new Error("Falha ao carregar chamados");
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { tickets, loading, error, refresh };
}
