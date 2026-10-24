"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HiOutlineCheck, HiOutlineX } from "react-icons/hi";
import { getFirebaseAuth } from "@/lib/admin/firebase";
import { useClinic } from "@/lib/admin/clinic-context";
import { saveProfile } from "@/lib/saas/account-store";
import { useSaas } from "@/lib/saas/context";
import { AdminStaggerItem } from "@/components/admin/motion/AdminPageMotion";
import { CardTitle } from "@/components/admin/ui";
import { buildOnboardingSteps } from "@/lib/saas/onboarding";
import { ACCOUNT_LABEL, daysRemaining, STATUS_LABEL, type AccountRecord } from "@/lib/saas/model";

export function TrialBanner() {
  const { account, access } = useSaas();
  if (!account) return null;
  if (access.mode === "blocked") {
    return (
      <div className="rounded-md border border-[#e8cfc4] bg-[#f6e6df] px-4 py-3 text-sm text-accent">
        Conta {account.accountStatus === "desativada" ? "desativada" : "suspensa"}. Os dados do consultório não foram apagados. A área de assinatura continua disponível.
      </div>
    );
  }
  if (access.mode === "restricted") {
    return (
      <div className="rounded-md border border-[#e8cfc4] bg-[#f6e6df] px-4 py-3 text-sm">
        <p className="font-medium text-accent">A avaliação não está mais liberando novos lançamentos.</p>
        <p className="mt-1 text-muted">Pacientes, agenda e financeiro já salvos continuam no painel. Para voltar a lançar, use a página de assinatura. Nenhum pagamento é confirmado enquanto o provedor não estiver ligado.</p>
        <Link href="/admin/assinatura" className="mt-2 inline-flex font-semibold text-teal">Ver assinatura</Link>
      </div>
    );
  }
  if (account.subscriptionStatus !== "trial_ativo") return null;
  const days = daysRemaining(account.trialEndsAtMillis, Date.now());
  const end = account.trialEndsAt
    ? new Date(account.trialEndsAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";
  return (
    <div className={`rounded-md border px-4 py-3 text-sm ${days <= 7 ? "border-[#e8cfc4] bg-[#f6e6df]" : "border-leaf bg-sky-soft"}`}>
      Avaliação gratuita até {end}. {days === 1 ? "Resta 1 dia." : `Restam ${days} dias.`}{" "}
      <Link href="/admin/assinatura" className="font-semibold text-teal">Ver condições</Link>
    </div>
  );
}

const EMAIL_BANNER_KEY = "psy-manager.email-banner-dismissed";

export function EmailBanner() {
  const { emailVerified, account } = useSaas();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!account?.uid) return;
    try {
      const raw = sessionStorage.getItem(EMAIL_BANNER_KEY);
      if (raw === account.uid) setDismissed(true);
    } catch {
      /* ignore */
    }
  }, [account?.uid]);

  if (!account || account.billingAccess === "legado" || emailVerified || dismissed) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(EMAIL_BANNER_KEY, account!.uid);
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-md border border-leaf bg-sky-soft px-3 py-3 text-sm text-ink sm:gap-3 sm:px-4"
    >
      <p className="min-w-0 flex-1 leading-relaxed">
        <span className="font-medium text-teal">Confirme o e-mail</span>{" "}
        <span className="break-all [overflow-wrap:anywhere]">{account.email}</span> pelo link enviado no cadastro. O acesso de avaliação já está aberto; a confirmação ajuda a recuperar a senha.
      </p>
      <button
        type="button"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-[#d7e0d8] bg-white text-teal"
        onClick={dismiss}
        aria-label="Fechar aviso de e-mail"
      >
        <HiOutlineX size={20} aria-hidden />
      </button>
    </div>
  );
}

export function AdminAccountNotices() {
  return (
    <div className="mb-5 grid gap-3 sm:gap-3.5">
      <EmailBanner />
      <TrialBanner />
    </div>
  );
}

export function OnboardingCard() {
  const { account, access, refresh } = useSaas();
  const { patients, appointments, payments, members } = useClinic();
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = getFirebaseAuth().currentUser;
        const token = user ? await user.getIdToken() : "";
        if (!token) return;
        const response = await fetch("/api/integrations/google-calendar", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = (await response.json()) as { settings?: { enabled?: boolean } };
        if (active) setGoogleConnected(Boolean(data.settings?.enabled));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      active = false;
    };
  }, [account?.uid]);

  const member = useMemo(
    () => members.find((item) => item.uid === account?.uid) ?? null,
    [members, account?.uid]
  );

  if (!account || account.onboardingDismissed || access.mode === "blocked") return null;

  const snapshot = buildOnboardingSteps({
    account,
    patients,
    appointments,
    payments,
    member,
    googleCalendarConnected: googleConnected,
  });

  const progress = snapshot.requiredTotal === 0 ? 0 : Math.round((snapshot.requiredDone / snapshot.requiredTotal) * 100);

  async function dismiss() {
    if (!account || !snapshot.complete) return;
    await saveProfile(account.uid, { onboardingDismissed: true });
    await refresh();
  }

  return (
    <AdminStaggerItem>
      <section className="admin-card mb-6 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <CardTitle>Primeiros passos</CardTitle>
          <h2 className="mt-1 text-2xl text-teal">{snapshot.complete ? "Tudo pronto por aqui" : "Configure o consultório"}</h2>
          <p className="mt-1 text-sm text-muted">
            {snapshot.complete
              ? "Você concluiu as etapas essenciais. Pode dispensar este cartão quando quiser."
              : `${snapshot.requiredDone} de ${snapshot.requiredTotal} etapas obrigatórias. Você pode usar a agenda a qualquer momento.`}
          </p>
          {!snapshot.complete ? (
            <>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper" aria-hidden>
                <div className="h-full rounded-full bg-teal transition-[width]" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted">{progress}% do essencial</p>
            </>
          ) : null}
        </div>
        {snapshot.complete ? (
          <button type="button" className="btn-text shrink-0" onClick={() => void dismiss()}>Dispensar</button>
        ) : null}
      </div>
      <ol className="mt-4 grid gap-2">
        {snapshot.steps.map((step) => (
          <li
            key={step.id}
            className="motion-press flex flex-wrap items-center justify-between gap-2 rounded-xl bg-paper px-3 py-2 text-sm sm:flex-nowrap"
          >
            <span className="flex min-w-0 items-start gap-2">
              <span className="mt-0.5 text-teal" aria-hidden>
                {step.done ? <HiOutlineCheck size={18} /> : <span className="inline-block h-[18px] w-[18px] rounded-full border border-[#d7e0d8] bg-white" />}
              </span>
              <span>
                {step.label}
                {step.optional ? <span className="text-muted"> (opcional)</span> : null}
              </span>
            </span>
            {!step.done ? (
              <Link href={step.href} className="shrink-0 font-semibold text-teal">
                Abrir
              </Link>
            ) : (
              <span className="shrink-0 text-xs text-muted">Feito</span>
            )}
          </li>
        ))}
      </ol>
    </section>
    </AdminStaggerItem>
  );
}

export function BlockedAccount({ account }: { account: AccountRecord }) {
  const label = account.accountStatus === "desativada" || account.accountStatus === "suspensa" ? ACCOUNT_LABEL[account.accountStatus] : "Indisponível";
  const commercial = account.subscriptionStatus && account.subscriptionStatus in STATUS_LABEL ? STATUS_LABEL[account.subscriptionStatus as keyof typeof STATUS_LABEL] : "Sem assinatura paga";
  return (
    <section className="admin-card bg-white p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Conta {label}</p>
      <h1 className="mt-2 text-4xl text-teal">O painel clínico está pausado</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Situação comercial: {commercial}. Pacientes, prontuários, agenda e financeiro não foram excluídos. Esta pausa é diferente de cancelar uma assinatura e diferente de apagar a conta.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/assinatura" className="btn-primary">Abrir assinatura</Link>
        <Link href="/admin/configuracoes" className="btn-text">Configurações</Link>
      </div>
    </section>
  );
}
