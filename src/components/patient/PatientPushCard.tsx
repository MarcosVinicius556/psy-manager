"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { subscribeWebPush, pushSupported, unsubscribeWebPush } from "@/lib/push/client";
import { patientFetch } from "@/lib/patient/api";

export default function PatientPushCard() {
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const supported = pushSupported();

  useEffect(() => {
    fetch("/api/push/subscribe")
      .then((r) => r.json())
      .then((data) => setConfigured(Boolean(data.configured && data.publicKey)))
      .catch(() => setConfigured(false));
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const meta = await fetch("/api/push/subscribe").then((r) => r.json());
      if (!meta.publicKey) {
        toast.info("Notificações push não estão configuradas neste ambiente.");
        return;
      }
      await subscribeWebPush(meta.publicKey);
      toast.success("Notificações ativadas.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível ativar.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      await unsubscribeWebPush();
      toast.success("Notificações desativadas.");
    } finally {
      setBusy(false);
    }
  }

  async function savePref(key: string, value: boolean) {
    const current = await patientFetch("/api/patient/push/preferences");
    const prefs = { ...(current.prefs as Record<string, boolean>), [key]: value };
    await patientFetch("/api/patient/push/preferences", {
      method: "PATCH",
      body: JSON.stringify({ prefs }),
    });
  }

  if (!supported) {
    return <p className="text-sm text-muted">Seu navegador não suporta notificações push.</p>;
  }

  return (
    <div className="space-y-3 text-sm">
      {!configured && (
        <p className="text-muted">Push indisponível sem chaves VAPID no servidor (o app continua funcionando).</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" disabled={busy || !configured} onClick={() => void enable()}>
          Ativar notificações
        </button>
        <button type="button" className="btn-text" disabled={busy} onClick={() => void disable()}>
          Desativar
        </button>
      </div>
      <p className="text-muted">Mensagens genéricas, sem conteúdo clínico na tela bloqueada.</p>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          defaultChecked
          onChange={(e) => void savePref("silencioNoturno", e.target.checked)}
        />
        Silêncio noturno (22h–7h, horário de Brasília)
      </label>
    </div>
  );
}
