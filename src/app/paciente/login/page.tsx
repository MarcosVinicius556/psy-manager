"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import { usePatientAuth } from "@/lib/patient/auth-context";

function PatientLoginInner() {
  const { sendMagicLink, configured } = usePatientAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const motivo = searchParams.get("motivo");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o link.");
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <BrandLogo className="mb-6 h-10" />
      <h1 className="mb-2 text-2xl font-medium text-teal">Portal do paciente</h1>
      <p className="mb-6 text-sm text-muted">
        Entre com um link enviado ao seu e-mail ou use o convite do seu psicólogo(a). Não é canal de emergência — em crise, ligue 188 (CVV).
      </p>
      {motivo === "portal_desativado" && (
        <p className="mb-4 rounded-surface border border-[var(--color-border-subtle)] bg-white p-3 text-sm text-accent">
          O portal foi desativado pelo profissional. Fale com o consultório se precisar de acesso.
        </p>
      )}
      {!configured && <p className="mb-4 text-sm text-accent">Firebase não configurado neste ambiente.</p>}
      {sent ? (
        <p className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4 text-sm">
          Enviamos um link para <strong>{email}</strong>. Abra no mesmo aparelho em que você pediu o acesso.
        </p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
          <label className="block text-sm">
            E-mail
            <input
              className="field mt-1 w-full"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          {error && <p className="text-sm text-accent">{error}</p>}
          <button type="submit" className="btn-primary w-full">Receber link de acesso</button>
        </form>
      )}
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
