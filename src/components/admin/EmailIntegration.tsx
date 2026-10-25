"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import { INTEGRATION_UNAVAILABLE_USER_MESSAGE } from "@/lib/integrations/user-messages";
import type { EmailIntegrationPublic } from "@/lib/email-integration/types";
import { Field, fieldClass } from "./ui";

async function authFetch(path: string, init?: RequestInit) {
  const headers = await authorizedHeaders(init?.headers);
  return fetch(path, { ...init, headers });
}

type Props = {
  embedded?: boolean;
};

export default function EmailIntegration({ embedded = false }: Props) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<EmailIntegrationPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [smtpAddress, setSmtpAddress] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [mode, setMode] = useState<"oauth" | "smtp">("oauth");

  const refresh = useCallback(async () => {
    const response = await authFetch("/api/integrations/email");
    const data = (await response.json()) as EmailIntegrationPublic;
    setStatus(data);
    if (data.smtpAvailable && !data.oauthAvailable) {
      setMode("smtp");
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await refresh();
      } catch {
        if (active) toast.error("Não foi possível carregar a integração de e-mail.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  useEffect(() => {
    const email = searchParams.get("email");
    if (email === "conectado") {
      toast.success("Gmail conectado para envio de e-mails.");
      void refresh();
    } else if (email === "erro") {
      toast.error("Não foi possível conectar o Gmail. Tente novamente.");
    }
  }, [searchParams, refresh]);

  async function connectGmail() {
    setConnecting(true);
    try {
      const response = await authFetch("/api/integrations/email/auth/start");
      const data = (await response.json()) as { url?: string; reason?: string };
      if (!response.ok || !data.url) throw new Error(data.reason || "indisponivel");
      window.location.href = data.url;
    } catch {
      toast.error("Integração de e-mail indisponível no momento.");
    } finally {
      setConnecting(false);
    }
  }

  async function saveSmtp(event: React.FormEvent) {
    event.preventDefault();
    setSavingSmtp(true);
    try {
      const response = await authFetch("/api/integrations/email/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: smtpAddress, appPassword: smtpPassword }),
      });
      const data = (await response.json()) as { reason?: string };
      if (!response.ok) throw new Error(data.reason || "falha");
      toast.success("SMTP do Gmail configurado.");
      setSmtpPassword("");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o SMTP.");
    } finally {
      setSavingSmtp(false);
    }
  }

  async function disconnect() {
    if (!window.confirm("Desconectar o envio de e-mails desta conta?")) return;
    setDisconnecting(true);
    try {
      const response = await authFetch("/api/integrations/email/disconnect", { method: "POST" });
      if (!response.ok) throw new Error("falha");
      toast.success("Integração de e-mail desconectada.");
      await refresh();
    } catch {
      toast.error("Não foi possível desconectar.");
    } finally {
      setDisconnecting(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    try {
      const response = await authFetch("/api/integrations/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as { sent?: boolean; reason?: string };
      if (!response.ok || !data.sent) throw new Error(data.reason || "falha");
      toast.success("E-mail de teste enviado.");
    } catch {
      toast.error("Não foi possível enviar o e-mail de teste.");
    } finally {
      setTesting(false);
    }
  }

  const connected = Boolean(status?.provider && status.connectedAddress);
  const oauthReady = Boolean(status?.oauthAvailable);
  const smtpReady = Boolean(status?.smtpAvailable);

  const inner = (
    <section data-testid="integration-email">
      <h2 className="text-2xl font-medium text-teal">E-mail</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Opcional: envie confirmações, contratos e recibos pela sua conta Gmail. Os dados de acesso ficam criptografados no servidor.
      </p>
      {loading ? (
        <p className="mt-4 text-sm text-muted">Carregando...</p>
      ) : !status?.available ? (
        <p className="mt-3 text-sm text-muted">{INTEGRATION_UNAVAILABLE_USER_MESSAGE}</p>
      ) : connected ? (
        <div className="mt-4 grid gap-4">
          <p className="text-sm text-ink">
            Conectado via <strong>{status.provider === "gmail_oauth" ? "Gmail (OAuth)" : "Gmail (SMTP)"}</strong>
            <br />
            <span className="break-all text-muted">{status.connectedAddress}</span>
            {status.connectedAt ? (
              <span className="block text-xs text-muted">Desde {new Date(status.connectedAt).toLocaleString("pt-BR")}</span>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-row" disabled={testing} onClick={() => void sendTest()}>
              {testing ? "Enviando..." : "Enviar e-mail de teste"}
            </button>
            <button type="button" className="btn-text text-accent" disabled={disconnecting} onClick={() => void disconnect()}>
              {disconnecting ? "Desconectando..." : "Desconectar"}
            </button>
            <Link href="/admin/operacional/email" className="btn-chip">
              Modelos de e-mail
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          {(oauthReady || smtpReady) && oauthReady && smtpReady ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={mode === "oauth" ? "btn-primary" : "btn-chip"}
                onClick={() => setMode("oauth")}
              >
                Gmail OAuth
              </button>
              <button
                type="button"
                className={mode === "smtp" ? "btn-primary" : "btn-chip"}
                onClick={() => setMode("smtp")}
              >
                Senha de app
              </button>
            </div>
          ) : null}
          {mode === "oauth" && oauthReady ? (
            <div className="grid gap-3">
              <p className="text-sm text-muted">
                Usamos apenas permissão para <strong>enviar e-mails</strong> (<code className="text-xs">gmail.send</code>). O Google Agenda continua com autorização separada.
              </p>
              <button type="button" className="btn-primary justify-self-start" disabled={connecting} onClick={() => void connectGmail()}>
                {connecting ? "Abrindo Google..." : "Conectar Gmail"}
              </button>
            </div>
          ) : smtpReady ? (
            <form onSubmit={saveSmtp} className="grid max-w-md gap-3">
              {!oauthReady ? (
                <p className="text-sm text-muted">Conecte com senha de app do Gmail enquanto o OAuth não estiver disponível neste ambiente.</p>
              ) : null}
              <p className="text-sm text-muted">
                Crie uma senha de app no Google (exige verificação em duas etapas):{" "}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal underline"
                >
                  myaccount.google.com/apppasswords
                </a>
                . Use os 16 caracteres sem espaços.
              </p>
              <Field label="E-mail do Gmail">
                <input
                  type="email"
                  className={fieldClass}
                  value={smtpAddress}
                  onChange={(event) => setSmtpAddress(event.target.value)}
                  required
                  autoComplete="email"
                />
              </Field>
              <Field label="Senha de app (16 caracteres)">
                <input
                  type="password"
                  className={fieldClass}
                  value={smtpPassword}
                  onChange={(event) => setSmtpPassword(event.target.value)}
                  required
                  autoComplete="off"
                  inputMode="text"
                />
              </Field>
              <button type="submit" className="btn-primary justify-self-start" disabled={savingSmtp}>
                {savingSmtp ? "Salvando..." : "Salvar SMTP"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-muted">{INTEGRATION_UNAVAILABLE_USER_MESSAGE}</p>
          )}
        </div>
      )}
    </section>
  );

  if (embedded) return inner;

  return (
    <div className="mt-6 rounded-md border border-[var(--color-border-subtle)] bg-white p-6">
      {inner}
    </div>
  );
}
