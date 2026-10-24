"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { HiOutlineEnvelope, HiOutlineEye, HiOutlineEyeSlash, HiOutlineUser } from "react-icons/hi2";
import BrandLogo from "@/components/BrandLogo";
import { useAuth } from "@/lib/admin/auth-context";
import { registerError, registerWorkspace } from "@/lib/saas/account-store";
import { validateSignup } from "@/lib/saas/model";

const errors: Record<string, string> = {
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/user-not-found": "Não encontramos este e-mail.",
  "auth/wrong-password": "Senha incorreta.",
  "auth/invalid-email": "E-mail inválido.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco e tente de novo.",
  "auth/network-request-failed": "Falha de conexão. Tente de novo.",
  "auth/popup-closed-by-user": "A janela do Google foi fechada antes de concluir.",
  "auth/popup-blocked": "O navegador bloqueou a janela do Google. Permita pop-ups e tente de novo.",
  "auth/account-exists-with-different-credential": "Este e-mail já entra com senha. Use e-mail e senha, ou recupere o acesso.",
  "auth/unauthorized-domain": "Este endereço ainda não está autorizado para o login com Google.",
  "auth/operation-not-allowed": "O login com Google ainda não está ativado neste projeto.",
};

function messageOf(error: unknown) {
  if (error instanceof FirebaseError) return errors[error.code] || "Não foi possível entrar.";
  return error instanceof Error ? error.message : "Não foi possível entrar.";
}

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

export default function AuthScreen({ mode }: { mode: "login" | "signup" }) {
  const { signIn, signInWithGoogle, sendPasswordReset, user, loading, configured } = useAuth();
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const mismatch = mode === "signup" && confirm.length > 0 && password !== confirm;

  useEffect(() => {
    if (!loading && user) router.replace("/admin");
  }, [loading, router, user]);

  function switchMode(next: "login" | "signup") {
    setMessage("");
    router.push(next === "login" ? "/admin/login" : "/cadastro");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const parsed = validateSignup({ nome, email, password, confirm, acceptTerms, honeypot });
        if (!parsed.ok) {
          setMessage(parsed.message);
          setSubmitting(false);
          return;
        }
        const result = await registerWorkspace({ ...parsed.value, password });
        router.replace(result.eligible ? "/admin" : "/admin/assinatura");
        return;
      }
      await signIn(email, password, remember);
      router.replace("/admin");
    } catch (error) {
      if (mode === "signup") {
        const { getFirebaseAuth } = await import("@/lib/admin/firebase");
        if (getFirebaseAuth().currentUser) {
          router.replace("/admin");
          return;
        }
        setMessage(registerError(error));
      } else {
        setMessage(messageOf(error));
      }
      setSubmitting(false);
    }
  }

  async function onGoogle() {
    if (mode === "signup" && !acceptTerms) {
      setMessage("Aceite os termos para criar a conta com o Google.");
      return;
    }
    setMessage("");
    setSubmitting(true);
    try {
      await signInWithGoogle(remember);
      router.replace("/admin");
    } catch (error) {
      if (error instanceof FirebaseError && error.code === "auth/popup-closed-by-user") {
        setSubmitting(false);
        return;
      }
      setMessage(messageOf(error));
      setSubmitting(false);
    }
  }

  async function onForgot() {
    if (!email.trim()) {
      setMessage("Informe o e-mail para recuperar a senha.");
      return;
    }
    setMessage("");
    try {
      await sendPasswordReset(email);
      setMessage("Enviamos um e-mail para redefinir a senha.");
    } catch (error) {
      setMessage(messageOf(error));
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#d7e0d8] p-3 sm:p-6">
      <div className="grid w-full max-w-[1080px] overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_rgba(23,47,51,0.18)] lg:min-h-[680px] lg:grid-cols-2">
        <div className="flex flex-col justify-center bg-[#f6f7f5] px-6 py-8 sm:px-10 sm:py-10">
          <Link href="/" aria-label="Psy Manager" className="inline-flex">
            <BrandLogo height={48} priority />
          </Link>
          <h1 className="mt-6 font-serif text-[2rem] font-medium leading-tight text-ink">
            {mode === "login" ? "Que bom ver você de novo" : "Vamos começar juntos"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {mode === "login"
              ? "Entre para continuar com a agenda, os pacientes e o financeiro."
              : "Nome, e-mail e senha. São 30 dias para conhecer o painel. O consultório você organiza depois."}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`h-11 rounded-full text-sm font-semibold transition ${mode === "login" ? "bg-teal text-white" : "border border-[#d5ddd6] bg-white text-teal"}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`h-11 rounded-full text-sm font-semibold transition ${mode === "signup" ? "bg-teal text-white" : "border border-[#d5ddd6] bg-white text-teal"}`}
            >
              Criar conta
            </button>
          </div>

          {!configured && (
            <p className="mt-4 rounded-2xl bg-[#f6e6df] px-4 py-3 text-sm text-accent">
              O acesso ainda não está disponível neste ambiente.
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-5 grid gap-3" noValidate>
            {mode === "signup" && (
              <label className="relative block">
                <span className="sr-only">Seu nome</span>
                <input
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  autoComplete="name"
                  placeholder="Nome e sobrenome"
                  required
                  minLength={3}
                  className="h-12 w-full rounded-full border border-[#d7e0d8] bg-white pr-12 pl-5 text-sm outline-none transition focus:border-teal"
                />
                <HiOutlineUser className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-lg text-muted" />
              </label>
            )}
            <label className="relative block">
              <span className="sr-only">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="Seu e-mail"
                required
                className="h-12 w-full rounded-full border border-[#d7e0d8] bg-white pr-12 pl-5 text-sm outline-none transition focus:border-teal"
              />
              <HiOutlineEnvelope className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-lg text-muted" />
            </label>
            <label className="relative block">
              <span className="sr-only">Senha</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder={mode === "signup" ? "Senha, mínimo de 8 caracteres" : "Sua senha"}
                required
                minLength={mode === "signup" ? 8 : 6}
                className="h-12 w-full rounded-full border border-[#d7e0d8] bg-white pr-12 pl-5 text-sm outline-none transition focus:border-teal"
              />
              <button
                type="button"
                className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-muted"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <HiOutlineEyeSlash className="text-lg" /> : <HiOutlineEye className="text-lg" />}
              </button>
            </label>
            {mode === "signup" && (
              <label className="relative block">
                <span className="sr-only">Confirmar senha</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  autoComplete="new-password"
                  placeholder="Confirme a senha"
                  required
                  minLength={8}
                  aria-invalid={mismatch}
                  className="h-12 w-full rounded-full border border-[#d7e0d8] bg-white px-5 text-sm outline-none transition focus:border-teal"
                />
              </label>
            )}
            {mismatch && <p className="px-2 text-sm text-accent">As senhas ainda não estão iguais.</p>}

            {mode === "login" ? (
              <div className="flex items-center justify-between gap-3 px-1 pt-1 text-sm">
                <label className="flex items-center gap-2 text-muted">
                  <input type="checkbox" className="accent-teal" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                  Lembrar de mim
                </label>
                <button type="button" className="font-semibold text-teal" onClick={onForgot}>
                  Esqueci a senha
                </button>
              </div>
            ) : (
              <label className="flex items-start gap-3 px-1 pt-1 text-sm leading-relaxed text-muted">
                <input type="checkbox" className="mt-1 accent-teal" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} required />
                <span>
                  Li e aceito os{" "}
                  <Link href="/termos" className="font-semibold text-teal underline decoration-leaf underline-offset-2">termos de uso</Link>
                  {" "}e a{" "}
                  <Link href="/privacidade" className="font-semibold text-teal underline decoration-leaf underline-offset-2">política de privacidade</Link>.
                </span>
              </label>
            )}

            <div className="absolute left-[-9999px] h-0 overflow-hidden" aria-hidden="true">
              <label htmlFor="website">Site</label>
              <input id="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
            </div>

            {message && <p className="px-1 text-sm text-accent" role="status">{message}</p>}

            <button
              className="mt-1 h-12 w-full rounded-full bg-teal text-sm font-semibold text-white transition hover:bg-teal-mid disabled:opacity-60"
              disabled={submitting || !configured}
            >
              {submitting ? "Aguarde..." : mode === "login" ? "Entrar" : "Começar meus 30 dias"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs tracking-[0.18em] text-muted">
            <span className="h-px flex-1 bg-[#d7e0d8]" />
            OU
            <span className="h-px flex-1 bg-[#d7e0d8]" />
          </div>

          <button
            type="button"
            onClick={onGoogle}
            disabled={submitting || !configured}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#d5ddd6] bg-white text-sm font-semibold text-ink transition hover:border-teal disabled:opacity-60"
          >
            <GoogleMark />
            {mode === "login" ? "Entrar com o Google" : "Criar conta com o Google"}
          </button>
          {mode === "login" && (
            <p className="mt-3 text-center text-xs leading-relaxed text-muted">
              No primeiro acesso com o Google, a conta entra na avaliação de 30 dias e vale o aceite dos{" "}
              <Link href="/termos" className="font-semibold text-teal underline decoration-leaf underline-offset-2">termos</Link>.
            </p>
          )}
        </div>

        <div className="relative order-first min-h-48 lg:order-none lg:min-h-full">
          <img src="/images/landing/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#122428]/80 via-[#122428]/15 to-transparent" />
          <p className="absolute right-5 bottom-5 left-5 max-w-sm rounded-2xl border border-white/25 bg-white/12 px-4 py-3 text-sm leading-relaxed text-white backdrop-blur-md">
            Agenda, pacientes e financeiro no mesmo lugar, com o ritmo do seu consultório.
          </p>
        </div>
      </div>
    </div>
  );
}
