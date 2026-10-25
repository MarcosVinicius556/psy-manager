"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { Field, fieldClass } from "@/components/admin/ui";
import { getFirebaseAuth } from "@/lib/admin/firebase";
import { INTEGRATION_UNAVAILABLE_USER_MESSAGE } from "@/lib/integrations/user-messages";
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

type Props = {
  embedded?: boolean;
};

export default function GoogleCalendarIntegration({ embedded = false }: Props) {
  const params = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [settings, setSettings] = useState<GoogleCalendarIntegrationSettings | null>(null);
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch("/api/integrations/google-calendar");
      const data = (await response.json()) as { available?: boolean; settings?: GoogleCalendarIntegrationSettings };
      setAvailable(Boolean(data.available));
      setSettings(data.settings || null);
    } catch {
      setAvailable(false);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCalendars = useCallback(async () => {
    try {
      const response = await authFetch("/api/integrations/google-calendar/calendars");
      if (!response.ok) return;
      const data = (await response.json()) as { calendars?: CalendarOption[] };
      setCalendars(data.calendars || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (settings?.enabled) loadCalendars();
  }, [settings?.enabled, loadCalendars]);

  useEffect(() => {
    const google = params.get("google");
    if (!google) return;
    if (google === "conectado") toast.success("Google Agenda conectado. Escolha o calendário e as opções de sincronização.");
    if (google === "erro") toast.error("Não foi possível conectar ao Google Agenda. Tente novamente.");
    loadStatus();
  }, [params, loadStatus]);

  async function connect() {
    setConnecting(true);
    try {
      const response = await authFetch("/api/integrations/google-calendar/auth/start");
      const data = (await response.json()) as { url?: string };
      if (!data.url) throw new Error("url");
      window.location.href = data.url;
    } catch {
      toast.error("Não foi possível iniciar a conexão com o Google.");
      setConnecting(false);
    }
  }

  async function saveSettings(patch: Partial<GoogleCalendarIntegrationSettings> & { calendarSummary?: string | null }) {
    setSaving(true);
    try {
      const response = await authFetch("/api/integrations/google-calendar/settings", {
        method: "PATCH",
        body: JSON.stringify({
          calendarId: patch.calendarId,
          calendarSummary: patch.calendarSummary,
          syncToGoogle: patch.syncToGoogle,
          syncFromGoogle: patch.syncFromGoogle,
          blockGoogleBusy: patch.blockGoogleBusy,
          showGoogleEventTitles: patch.showGoogleEventTitles,
          eventTitleMode: patch.eventTitleMode,
        }),
      });
      if (!response.ok) throw new Error("save");
      const data = (await response.json()) as { settings?: GoogleCalendarIntegrationSettings };
      if (data.settings) setSettings(data.settings);
      toast.success("Integração atualizada.");
    } catch {
      toast.error("Não foi possível salvar as preferências do Google Agenda.");
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      const response = await authFetch("/api/integrations/google-calendar/disconnect", { method: "POST" });
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
      });
      setCalendars([]);
      toast.success("Google Agenda desconectado.");
    } catch {
      toast.error("Não foi possível desconectar. Tente novamente.");
    } finally {
      setDisconnecting(false);
    }
  }

  if (!embedded && loading) {
    return (
      <div className="mt-6 rounded-md border border-[var(--color-border-subtle)] bg-white p-6">
        <p className="text-sm text-muted">Carregando integrações...</p>
      </div>
    );
  }

  const section = (
    <section data-testid="integration-google-calendar">
      <h2 className="mt-1 text-2xl font-medium text-teal">Google Agenda</h2>
      {loading ? (
        <p className="mt-3 text-sm text-muted">Carregando...</p>
      ) : !available ? (
        <p className="mt-3 text-sm text-muted">{INTEGRATION_UNAVAILABLE_USER_MESSAGE}</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">
            Opcional e individual: só a sua conta Google. Atendimentos em que você é o profissional responsável são sincronizados
            mesmo se outra pessoa agendar no sistema. Em locais compartilhados, colegas veem apenas &quot;Ocupado&quot; — nunca o
            conteúdo do seu Google.
          </p>
          {settings?.enabled ? (
            <div className="mt-5 grid gap-4">
              <p className="text-sm text-ink">
                Conectado como <strong>{settings.googleEmail || "conta Google"}</strong>
                {settings.calendarSummary ? ` · calendário: ${settings.calendarSummary}` : ""}
              </p>
              <Field label="Calendário de destino">
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
                  <option value="">Selecione um calendário</option>
                  {calendars.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.summary}{item.primary ? " (principal)" : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="flex items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={settings.syncToGoogle}
                  disabled={saving || !settings.calendarId}
                  onChange={(event) => void saveSettings({ syncToGoogle: event.target.checked })}
                />
                <span>Enviar atendimentos do sistema para o Google Agenda</span>
              </label>
              <label className="flex items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={settings.syncFromGoogle}
                  disabled={saving || !settings.calendarId}
                  onChange={(event) => void saveSettings({ syncFromGoogle: event.target.checked })}
                />
                <span>Mostrar meus eventos do Google na agenda do sistema</span>
              </label>
              <label className="flex items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={settings.blockGoogleBusy}
                  disabled={saving || !settings.calendarId}
                  onChange={(event) => void saveSettings({ blockGoogleBusy: event.target.checked })}
                />
                <span>Bloquear agendamentos quando eu estiver ocupado no Google (em qualquer local)</span>
              </label>
              <label className="flex items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={settings.showGoogleEventTitles}
                  disabled={saving || !settings.calendarId || !settings.syncFromGoogle}
                  onChange={(event) => void saveSettings({ showGoogleEventTitles: event.target.checked })}
                />
                <span>Mostrar títulos dos meus eventos do Google só para mim (outros veem &quot;Ocupado&quot;)</span>
              </label>
              <Field label="Título dos eventos no Google (privacidade)">
                <select
                  className={fieldClass}
                  value={settings.eventTitleMode}
                  disabled={saving}
                  onChange={(event) =>
                    void saveSettings({ eventTitleMode: event.target.value as GoogleCalendarEventTitleMode })
                  }
                >
                  <option value="generic">Somente &quot;Atendimento&quot;</option>
                  <option value="first_name">Atendimento - primeiro nome do paciente</option>
                </select>
              </Field>
              <button type="button" className="btn-text justify-self-start text-[#a01f1f]" disabled={disconnecting} onClick={() => void disconnect()}>
                {disconnecting ? "Desconectando..." : "Desconectar"}
              </button>
            </div>
          ) : (
            <button type="button" className="btn-primary mt-5" disabled={connecting} onClick={() => void connect()}>
              {connecting ? "Redirecionando..." : "Conectar Google Agenda"}
            </button>
          )}
        </>
      )}
    </section>
  );

  if (embedded) return section;

  return (
    <div className="mt-6 rounded-md border border-[var(--color-border-subtle)] bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Integrações</p>
      {section}
    </div>
  );
}
