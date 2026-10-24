"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { Card, Field, fieldClass } from "@/components/admin/ui";
import { getFirebaseAuth } from "@/lib/admin/firebase";
import type { GoogleCalendarEventTitleMode, GoogleCalendarIntegrationSettings } from "@/lib/google-calendar/types";

type CalendarOption = { id: string; summary: string; primary?: boolean };

async function authFetch(path: string, init?: RequestInit) {
  const user = getFirebaseAuth().currentUser;
  const token = user ? await user.getIdToken() : "";
  if (!token) throw new Error("nao_autenticado");
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(path, { ...init, headers });
}

export default function GoogleCalendarLocationIntegration({ locationId, locationName }: { locationId: string; locationName: string }) {
  const params = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [owner, setOwner] = useState(false);
  const [settings, setSettings] = useState<GoogleCalendarIntegrationSettings | null>(null);
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch(`/api/integrations/google-calendar/location/${locationId}`);
      const data = (await response.json()) as {
        available?: boolean;
        owner?: boolean;
        settings?: GoogleCalendarIntegrationSettings;
      };
      setAvailable(Boolean(data.available));
      setOwner(Boolean(data.owner));
      setSettings(data.settings || null);
    } catch {
      setAvailable(false);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  const loadCalendars = useCallback(async () => {
    try {
      const response = await authFetch(`/api/integrations/google-calendar/calendars?locationId=${encodeURIComponent(locationId)}`);
      if (!response.ok) return;
      const data = (await response.json()) as { calendars?: CalendarOption[] };
      setCalendars(data.calendars || []);
    } catch {
      // ignore
    }
  }, [locationId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (settings?.enabled && owner) loadCalendars();
  }, [settings?.enabled, owner, loadCalendars]);

  useEffect(() => {
    const google = params.get("google");
    if (!google) return;
    if (google === "conectado") toast.success("Calendário do consultório conectado.");
    if (google === "erro") toast.error("Não foi possível conectar o calendário do consultório.");
    loadStatus();
  }, [params, loadStatus]);

  async function connect() {
    setConnecting(true);
    try {
      const response = await authFetch(`/api/integrations/google-calendar/auth/start?locationId=${encodeURIComponent(locationId)}`);
      const data = (await response.json()) as { url?: string };
      if (!data.url) throw new Error("url");
      window.location.href = data.url;
    } catch {
      toast.error("Não foi possível iniciar a conexão.");
      setConnecting(false);
    }
  }

  async function saveSettings(patch: Partial<GoogleCalendarIntegrationSettings> & { calendarSummary?: string | null }) {
    setSaving(true);
    try {
      const response = await authFetch(`/api/integrations/google-calendar/location/${locationId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error("save");
      const data = (await response.json()) as { settings?: GoogleCalendarIntegrationSettings };
      if (data.settings) setSettings(data.settings);
      toast.success("Calendário do consultório atualizado.");
    } catch {
      toast.error("Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      const response = await authFetch("/api/integrations/google-calendar/disconnect", {
        method: "POST",
        body: JSON.stringify({ locationId }),
      });
      if (!response.ok) throw new Error("disconnect");
      setSettings({
        enabled: false,
        googleEmail: null,
        calendarId: null,
        calendarSummary: null,
        syncToGoogle: false,
        syncFromGoogle: false,
        blockGoogleBusy: false,
        showGoogleEventTitles: false,
        eventTitleMode: "generic",
        connectedAt: null,
        kind: "location",
        locationId,
      });
      setCalendars([]);
      toast.success("Calendário do consultório desconectado.");
    } catch {
      toast.error("Não foi possível desconectar.");
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) return <p className="mt-4 text-sm text-muted">Carregando integração do consultório...</p>;
  if (!available) {
    return (
      <p className="mt-4 text-sm text-muted">
        Integração com Google Agenda indisponível no momento (configuração do servidor pendente).
      </p>
    );
  }

  return (
    <Card className="mt-4">
      <h3 className="text-lg font-medium text-teal">Google Agenda do consultório</h3>
      <p className="mt-2 text-sm text-muted">
        Opcional. Só quem criou <strong>{locationName}</strong> pode vincular um calendário da sala. Cada agendamento neste local
        pode ser copiado para esse calendário (sem dados clínicos). Colegas no local continuam vendo apenas &quot;Ocupado&quot; na agenda
        do sistema — não enxergam o Google um do outro.
      </p>
      {!owner ? (
        <p className="mt-3 text-sm text-ink">
          {settings?.enabled
            ? "Este consultório tem um calendário Google vinculado pelo responsável."
            : "O responsável pelo local ainda não vinculou um calendário Google da sala."}
        </p>
      ) : settings?.enabled ? (
        <div className="mt-4 grid gap-3">
          <p className="text-sm text-ink">
            Conectado como <strong>{settings.googleEmail}</strong>
            {settings.calendarSummary ? ` · ${settings.calendarSummary}` : ""}
          </p>
          <Field label="Calendário da sala">
            <select
              className={fieldClass}
              value={settings.calendarId || ""}
              disabled={saving}
              onChange={(event) => {
                const option = calendars.find((item) => item.id === event.target.value);
                void saveSettings({
                  calendarId: event.target.value || null,
                  calendarSummary: option?.summary || null,
                });
              }}
            >
              <option value="">Selecione</option>
              {calendars.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.summary}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={settings.syncToGoogle}
              disabled={saving || !settings.calendarId}
              onChange={(event) => void saveSettings({ syncToGoogle: event.target.checked })}
            />
            <span>Enviar todos os agendamentos deste consultório para o Google</span>
          </label>
          <Field label="Título no Google (privacidade)">
            <select
              className={fieldClass}
              value={settings.eventTitleMode}
              disabled={saving}
              onChange={(event) => void saveSettings({ eventTitleMode: event.target.value as GoogleCalendarEventTitleMode })}
            >
              <option value="generic">Consultório ocupado</option>
              <option value="first_name">Consultório ocupado (sem nome de paciente)</option>
            </select>
          </Field>
          <button type="button" className="btn-text text-[#a01f1f]" disabled={disconnecting} onClick={() => void disconnect()}>
            {disconnecting ? "Desconectando..." : "Desconectar calendário da sala"}
          </button>
        </div>
      ) : (
        <button type="button" className="btn-primary mt-4" disabled={connecting} onClick={() => void connect()}>
          {connecting ? "Redirecionando..." : "Conectar calendário da sala"}
        </button>
      )}
    </Card>
  );
}
