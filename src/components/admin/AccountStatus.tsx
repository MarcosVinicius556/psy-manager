"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Field, fieldClass } from "@/components/admin/ui";
import { useClinic } from "@/lib/admin/clinic-context";
import { saveProfile } from "@/lib/saas/account-store";
import { useSaas } from "@/lib/saas/context";
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
  const end = account.trialEndsAt ? new Date(account.trialEndsAt).toLocaleString("pt-BR") : "";
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
      className="flex items-start gap-3 rounded-md border border-leaf bg-sky-soft px-4 py-3 text-sm text-ink"
    >
      <p className="min-w-0 flex-1 leading-relaxed">
        <span className="font-medium text-teal">Confirme o e-mail</span>{" "}
        <span className="break-all">{account.email}</span> pelo link enviado no cadastro. O acesso de avaliação já está aberto; a confirmação ajuda a recuperar a senha.
      </p>
      <button type="button" className="btn-text shrink-0 min-h-11 px-3 py-2 text-xs" onClick={dismiss} aria-label="Dispensar aviso de e-mail">
        Dispensar
      </button>
    </div>
  );
}

export function AdminAccountNotices() {
  return (
    <div className="mb-4 grid gap-3">
      <EmailBanner />
      <TrialBanner />
    </div>
  );
}

export function OnboardingCard() {
  const { account, access, refresh } = useSaas();
  const { patients } = useClinic();
  const [clinicName, setClinicName] = useState(account?.clinicName || "");
  const [saving, setSaving] = useState(false);
  if (!account || account.onboardingDismissed || access.mode === "blocked") return null;
  const steps = [
    { id: "perfil", label: "Confira seu nome em Configurações", done: account.nome.trim().length > 2, href: "/admin/configuracoes" },
    { id: "clinica", label: "Dê um nome ao consultório, se quiser", done: account.clinicName.trim().length > 1, href: "" },
    { id: "paciente", label: "Cadastre o primeiro paciente quando for a hora", done: patients.length > 0, href: "/admin/pacientes/novo" },
  ];
  const done = steps.filter((step) => step.done).length;
  if (done === steps.length) return null;

  async function dismiss() {
    if (!account) return;
    await saveProfile(account.uid, { onboardingDismissed: true });
    await refresh();
  }

  async function saveClinic(event: React.FormEvent) {
    event.preventDefault();
    if (!account) return;
    setSaving(true);
    try {
      await saveProfile(account.uid, { clinicName: clinicName.trim() });
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o consultório.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-6 rounded-md bg-white p-6 shadow-[0_18px_50px_rgba(61,82,64,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal/70">Primeiros passos</p>
          <h2 className="mt-1 text-2xl text-teal">Sua conta já está pronta</h2>
          <p className="mt-1 text-sm text-muted">{done} de {steps.length}. Nada disso impede você de usar a agenda.</p>
        </div>
        <button type="button" className="btn-text" onClick={() => void dismiss()}>Dispensar</button>
      </div>
      <ol className="mt-4 grid gap-2">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center justify-between gap-3 rounded-md bg-paper px-3 py-2 text-sm">
            <span>{step.done ? "Feito" : "Pendente"} — {step.label}</span>
            {!step.done && step.href ? <Link href={step.href} className="font-semibold text-teal">Abrir</Link> : null}
          </li>
        ))}
      </ol>
      {account.clinicName.trim().length < 2 && (
        <form onSubmit={saveClinic} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="Nome do consultório">
            <input id="clinic-name" className={fieldClass} value={clinicName} onChange={(event) => setClinicName(event.target.value)} placeholder="Pode ser o seu nome ou o da sala" minLength={2} />
          </Field>
          <button className="btn-primary" disabled={saving || clinicName.trim().length < 2}>{saving ? "Salvando..." : "Salvar"}</button>
        </form>
      )}
    </section>
  );
}

export function BlockedAccount({ account }: { account: AccountRecord }) {
  const label = account.accountStatus === "desativada" || account.accountStatus === "suspensa" ? ACCOUNT_LABEL[account.accountStatus] : "Indisponível";
  const commercial = account.subscriptionStatus && account.subscriptionStatus in STATUS_LABEL ? STATUS_LABEL[account.subscriptionStatus as keyof typeof STATUS_LABEL] : "Sem assinatura paga";
  return (
    <section className="rounded-md bg-white p-8 shadow-[0_18px_50px_rgba(61,82,64,0.08)]">
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
