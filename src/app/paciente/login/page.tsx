"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import { patientAuthErrorMessage, usePatientAuth } from "@/lib/patient/auth-context";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.98 10.72A5.4 5.4 0 0 1 3.7 9c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.02-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

function PatientLoginInner() {
  const {
    sendMagicLink,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    sendPasswordReset,
    configured,
    refreshProfile,
  } = usePatientAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"entrar" | "criar" | "link">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const motivo = searchParams.get("motivo");

  async function afterAuth() {
    await refreshProfile();
    router.replace("/paciente");
  }

  async function onPasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      if (mode === "criar") {
        await signUpWithPassword(email, password);
      } else {
        await signInWithPassword(email, password);
      }
      await afterAuth();
    } catch (err) {
      setError(patientAuthErrorMessage(err));
    }
  }

  async function onMagicSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(patientAuthErrorMessage(err));
    }
  }

  async function onGoogle() {
    setError("");
    try {
      await signInWithGoogle();
      await afterAuth();
    } catch (err) {
      setError(patientAuthErrorMessage(err));
    }
  }

  async function onReset() {
    setError("");
    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (err) {
      setError(patientAuthErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <BrandLogo className="mb-6 h-10" />
      <h1 className="mb-2 text-2xl font-medium text-teal">Portal do paciente</h1>
      <p className="mb-6 text-sm text-muted">
        Crie sua conta ou entre para acompanhar tarefas, documentos e mensagens do seu psicólogo(a). Não é canal de emergência — em crise, ligue 188 (CVV).
      </p>
      {motivo === "portal_desativado" && (
        <p className="mb-4 rounded-surface border border-[var(--color-border-subtle)] bg-white p-3 text-sm text-accent">
          O portal foi desativado pelo profissional. Você pode gerenciar conexões em Minhas conexões.
        </p>
      )}
      {!configured && <p className="mb-4 text-sm text-accent">Firebase não configurado neste ambiente.</p>}

      <div className="mb-4 flex gap-2">
        <button type="button" className={`btn-chip flex-1 ${mode === "entrar" ? "border-teal text-teal" : ""}`} onClick={() => setMode("entrar")}>
          Entrar
        </button>
        <button type="button" className={`btn-chip flex-1 ${mode === "criar" ? "border-teal text-teal" : ""}`} onClick={() => setMode("criar")}>
          Criar conta
        </button>
        <button type="button" className={`btn-chip flex-1 ${mode === "link" ? "border-teal text-teal" : ""}`} onClick={() => setMode("link")}>
          Link por e-mail
        </button>
      </div>

      {mode === "link" ? (
        sent ? (
          <p className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4 text-sm">
            Enviamos um link para <strong>{email}</strong>. Abra no mesmo aparelho em que você pediu o acesso.
          </p>
        ) : (
          <form onSubmit={(e) => void onMagicSubmit(e)} className="space-y-3">
            <label className="block text-sm">
              E-mail
              <input className="field mt-1 w-full" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
            {error && <p className="text-sm text-accent">{error}</p>}
            <button type="submit" className="btn-primary w-full">Receber link de acesso</button>
          </form>
        )
      ) : (
        <form onSubmit={(e) => void onPasswordSubmit(e)} className="space-y-3">
          <label className="block text-sm">
            E-mail
            <input className="field mt-1 w-full" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          <label className="block text-sm">
            Senha
            <input className="field mt-1 w-full" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "criar" ? "new-password" : "current-password"} />
          </label>
          {mode === "criar" && (
            <p className="text-xs text-muted">Enviaremos um e-mail de verificação. Você pode usar o portal antes de confirmar.</p>
          )}
          {error && <p className="text-sm text-accent">{error}</p>}
          {resetSent && <p className="text-sm text-teal">Enviamos instruções de recuperação para seu e-mail.</p>}
          <button type="submit" className="btn-primary w-full">{mode === "criar" ? "Criar conta" : "Entrar"}</button>
          {mode === "entrar" && (
            <button type="button" className="btn-text w-full text-sm" onClick={() => void onReset()}>
              Esqueci minha senha
            </button>
          )}
        </form>
      )}

      <div className="my-4 border-t border-[var(--color-border-subtle)] pt-4">
        <button type="button" className="btn-row flex w-full items-center justify-center gap-2" onClick={() => void onGoogle()}>
          <GoogleMark />
          Entrar com Google
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-muted">
        <Link href="/privacidade" className="text-teal">Privacidade</Link>
      </p>
    </div>
  );
}

export default function PatientLoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted">Carregando…</p>}>
      <PatientLoginInner />
    </Suspense>
  );
}
