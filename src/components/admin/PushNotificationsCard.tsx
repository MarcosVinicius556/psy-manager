"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card, Field } from "@/components/admin/ui";
import { useAuth } from "@/lib/admin/auth-context";
import { getFirebaseAuth } from "@/lib/admin/firebase";
import { pushSupported, subscribeWebPush, unsubscribeWebPush } from "@/lib/push/client";
import type { PushPrefs } from "@/lib/server/web-push";

const DEFAULT_PREFS: PushPrefs = {
  agenda: true,
  confirmacoes: true,
  pagamentos: true,
  chamados: true,
  silencioNoturno: true,
};

export default function PushNotificationsCard() {
  const { user } = useAuth();
  const [configured, setConfigured] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<PushPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/push/subscribe");
        const data = (await response.json()) as { configured?: boolean; publicKey?: string };
        if (!active) return;
        setConfigured(Boolean(data.configured));
        setPublicKey(data.publicKey || null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    import("firebase/firestore").then(({ doc, getDoc }) => {
      import("@/lib/admin/firebase").then(({ getFirebaseDb }) => {
        void getDoc(doc(getFirebaseDb(), "users", user.uid)).then((snap) => {
          const raw = snap.data()?.pushPrefs;
          if (raw && typeof raw === "object") {
            setPrefs({
              agenda: raw.agenda !== false,
              confirmacoes: raw.confirmacoes !== false,
              pagamentos: raw.pagamentos !== false,
              chamados: raw.chamados !== false,
              silencioNoturno: raw.silencioNoturno !== false,
            });
          }
        });
      });
    });
  }, [user]);

  async function savePrefs(next: PushPrefs) {
    setPrefs(next);
    if (!user) return;
    const idToken = await user.getIdToken();
    await fetch("/api/push/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(next),
    });
  }

  async function onSubscribe() {
    if (!publicKey) {
      toast.info("Notificações push ainda não estão configuradas no servidor.");
      return;
    }
    setSubscribing(true);
    try {
      await subscribeWebPush(publicKey);
      toast.success("Notificações ativadas neste dispositivo.");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      if (reason === "permissao_negada") toast.warn("Permissão de notificação negada.");
      else toast.error("Não foi possível ativar as notificações.");
    } finally {
      setSubscribing(false);
    }
  }

  async function onUnsubscribe() {
    setSubscribing(true);
    try {
      await unsubscribeWebPush();
      toast.success("Notificações desativadas neste dispositivo.");
    } catch {
      toast.error("Não foi possível desativar.");
    } finally {
      setSubscribing(false);
    }
  }

  if (loading) return null;

  return (
    <Card className="mt-6">
      <h2 className="text-2xl font-medium text-teal">Notificações no celular</h2>
      <p className="mt-2 text-sm text-muted">
        Receba avisos genéricos sobre agenda, confirmações e chamados. Nenhum nome de paciente aparece na tela bloqueada.
      </p>
      {!configured ? (
        <p className="mt-3 text-sm text-muted">Push indisponível até o administrador configurar as chaves VAPID no servidor.</p>
      ) : !pushSupported() ? (
        <p className="mt-3 text-sm text-muted">Este navegador não suporta notificações push.</p>
      ) : (
        <div className="mt-4 grid gap-4">
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary min-h-11" disabled={subscribing} onClick={() => void onSubscribe()}>
              {subscribing ? "Aguarde..." : "Ativar neste dispositivo"}
            </button>
            <button type="button" className="btn-text min-h-11" disabled={subscribing} onClick={() => void onUnsubscribe()}>
              Desativar neste dispositivo
            </button>
          </div>
          <div className="grid gap-2 text-sm">
            {(
              [
                ["agenda", "Agenda e lembretes"],
                ["confirmacoes", "Confirmações e remarcações"],
                ["pagamentos", "Pagamentos vencidos"],
                ["chamados", "Chamados de suporte"],
                ["silencioNoturno", "Silêncio noturno (22h–7h, horário de Brasília)"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={key === "silencioNoturno" ? prefs.silencioNoturno : prefs[key]}
                  onChange={(event) => {
                    const next = { ...prefs, [key]: event.target.checked };
                    void savePrefs(next);
                  }}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <Field label="iPhone">
            <p className="text-sm text-muted">No iOS 16.4 ou superior, instale o app na tela inicial antes de ativar o push.</p>
          </Field>
        </div>
      )}
    </Card>
  );
}
