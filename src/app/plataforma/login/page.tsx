"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MultiFactorResolver } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import MfaSignInChallenge from "@/components/auth/MfaSignInChallenge";
import { fieldClass } from "@/components/admin/ui";
import { useAuth } from "@/lib/admin/auth-context";
import { getUserRole } from "@/lib/admin/collections";
import { isMfaSignInRequired } from "@/lib/auth/mfa-sign-in";

export default function PlatformLoginPage() {
  const { signIn, logout, configured } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);

  async function finishLogin() {
    const { getFirebaseAuth } = await import("@/lib/admin/firebase");
    const uid = getFirebaseAuth().currentUser?.uid;
    const role = uid ? await getUserRole(uid) : "psicologo";
    if (role !== "super_admin") {
      await logout();
      setMessage("Esta área é exclusiva do proprietário da plataforma.");
      return;
    }
    router.replace("/plataforma");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      await signIn(email, password);
      await finishLogin();
    } catch (error) {
      if (isMfaSignInRequired(error)) {
        setMfaResolver(error.resolver);
        return;
      }
      const code = error instanceof FirebaseError ? error.code : "";
      setMessage(code === "auth/too-many-requests" ? "Muitas tentativas. Aguarde e tente de novo." : "Não foi possível entrar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4 py-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-md bg-white p-5 shadow-[0_18px_50px_rgba(61,82,64,0.12)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Proprietário</p>
        <h1 className="mt-2 font-serif text-[clamp(1.8rem,6vw,2.25rem)] font-medium leading-tight text-teal">Plataforma</h1>
        <p className="mt-2 text-muted">Indicadores, contas e comunicação. Prontuários não aparecem aqui.</p>
        {!configured && <p className="mt-4 rounded-md bg-[#f6e6df] px-4 py-3 text-sm text-accent">Configure o Firebase para entrar.</p>}
        <label className="mt-6 block text-sm font-medium" htmlFor="email">E-mail</label>
        <input id="email" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required className={`${fieldClass} mt-1`} value={email} onChange={(event) => setEmail(event.target.value)} />
        <label className="mt-4 block text-sm font-medium" htmlFor="senha">Senha</label>
        <input id="senha" type="password" autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} required className={`${fieldClass} mt-1`} value={password} onChange={(event) => setPassword(event.target.value)} />
        {message && <p className="mt-3 text-sm text-accent" role="alert">{message}</p>}
        {mfaResolver && (
          <MfaSignInChallenge
            resolver={mfaResolver}
            onCancel={() => setMfaResolver(null)}
            onSuccess={() => {
              setMfaResolver(null);
              void finishLogin();
            }}
          />
        )}
        <button className="btn-primary mt-6 min-h-11 w-full" disabled={submitting || !configured || Boolean(mfaResolver)}>
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
