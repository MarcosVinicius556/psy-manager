"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/admin/auth-context";
import { getFirebaseAuth } from "@/lib/admin/firebase";
import { upsertPsychologist } from "@/lib/admin/collections";
import { ensureNotices, listInbox, loadPlans, publishedOrDefault, readAccount, reconcileAccount, setNoticeEmailResult, touchLastSeen, type InboxItem } from "./account-store";
import { setClinicWriteGate, ClinicAccessError } from "./guard";
import { noticeContent, resolveAccess, writesAllowed, type AccessDecision, type AccountRecord, type PlanDefinition } from "./model";
import { deliverOperationalEmail } from "./email-client";
import { maybeRecordAtivo7Dias } from "./activation-events";

type SaasContextValue = {
  ready: boolean;
  account: AccountRecord | null;
  plans: PlanDefinition[];
  inbox: InboxItem[];
  access: AccessDecision;
  emailVerified: boolean;
  refresh: () => Promise<void>;
};

const SaasContext = createContext<SaasContextValue | undefined>(undefined);

export function SaasProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState<AccountRecord | null>(null);
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [error, setError] = useState("");

  async function refresh() {
    if (!user) return;
    const preflight = await readAccount(user.uid);
    if (preflight.exists && preflight.account.role === "super_admin") {
      const nextPlans = publishedOrDefault(await loadPlans().catch(() => []));
      const nextInbox = await listInbox(user.uid).catch(() => []);
      setAccount(preflight.account);
      setPlans(nextPlans);
      setInbox(nextInbox);
      setClinicWriteGate(() => {});
      try {
        await touchLastSeen(user.uid, preflight.account.lastSeenAt);
      } catch (seenError) {
        console.error(seenError);
      }
      return;
    }
    await upsertPsychologist(user.uid, user.email || "", { nome: user.displayName || "", foto: user.photoURL || "" });
    const loaded = await readAccount(user.uid);
    if (!loaded.exists) {
      throw new Error("Conta não encontrada.");
    }
    const reconciled = await reconcileAccount(loaded.account);
    const nextPlans = publishedOrDefault(await loadPlans().catch(() => []));
    const nextInbox = await listInbox(user.uid).catch(() => []);
    setAccount(reconciled);
    setPlans(nextPlans);
    setInbox(nextInbox);
    const decision = resolveAccess(reconciled, Date.now());
    setClinicWriteGate(() => {
      if (!writesAllowed(reconciled, Date.now())) {
        throw new ClinicAccessError(
          decision.mode === "blocked"
            ? "Esta conta está suspensa ou desativada. Os dados não foram apagados, mas os lançamentos estão bloqueados."
            : undefined
        );
      }
    });
    try {
      await touchLastSeen(user.uid, reconciled.lastSeenAt);
    } catch (seenError) {
      console.error(seenError);
    }
    void maybeRecordAtivo7Dias(reconciled.uid, reconciled.createdAt);
  }

  useEffect(() => {
    let active = true;
    if (!user) {
      setAccount(null);
      setReady(false);
      return;
    }
    setReady(false);
    setError("");
    refresh()
      .catch((loadError) => {
        console.error(loadError);
        if (!active) return;
        setError("Não foi possível confirmar a situação da conta.");
        setClinicWriteGate(() => {
          throw new ClinicAccessError("Não foi possível confirmar a situação da conta. Tente entrar de novo.");
        });
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!ready || !account || !user) return;
    let active = true;
    (async () => {
      try {
        const created = await ensureNotices(account, inbox.map((item) => item.id));
        if (!active || created.length === 0) return;
        const token = await getFirebaseAuth().currentUser?.getIdToken();
        for (const kind of created) {
          const content = noticeContent(kind, account);
          let emailResult = "nao_enviado";
          if (token && account.operationalEmail) {
            const result = await deliverOperationalEmail(token, {
              kind,
              to: account.email,
              accountUid: account.uid,
              subject: content.titulo,
              text: content.corpo,
            });
            emailResult = result.delivered ? "enviado" : result.reason;
          }
          if (!account.operationalEmail) emailResult = "preferencia_desligada";
          try {
            await setNoticeEmailResult(account.uid, kind, emailResult);
          } catch (error) {
            console.error(error);
          }
        }
        if (active) {
          const nextInbox = await listInbox(account.uid);
          setInbox(nextInbox);
        }
      } catch (error) {
        console.error(error);
      }
    })();
    return () => {
      active = false;
    };
  }, [ready, account, user]);

  const access = useMemo(() => resolveAccess(account ?? emptyAccessAccount(), Date.now()), [account]);

  if (!ready) {
    return <div className="grid min-h-screen place-items-center bg-paper text-muted">Preparando o consultório...</div>;
  }

  if (error || !account) {
    return <div className="grid min-h-screen place-items-center bg-paper px-6 text-center text-muted">{error || "Não foi possível preparar o consultório."}</div>;
  }

  return (
    <SaasContext.Provider
      value={{
        ready,
        account,
        plans,
        inbox,
        access,
        emailVerified: Boolean(user?.emailVerified),
        refresh,
      }}
    >
      {children}
    </SaasContext.Provider>
  );
}

function emptyAccessAccount(): AccountRecord {
  return {
    uid: "",
    email: "",
    nome: "",
    clinicName: "",
    role: "psicologo",
    accountStatus: "",
    subscriptionStatus: "",
    billingAccess: "",
    planId: "",
    trialStartedAt: "",
    trialEndsAt: "",
    trialStartedAtMillis: 0,
    trialEndsAtMillis: 0,
    termsAcceptedAt: "",
    termsVersion: "",
    privacyAcknowledgedAt: "",
    checkoutStatus: "",
    checkoutPlanId: "",
    checkoutRequestedAt: "",
    cancelAtPeriodEnd: false,
    accessUntilMillis: 0,
    canceledAt: "",
    cancelReason: "",
    paidUntilMillis: 0,
    pixTxid: "",
    onboardingDismissed: true,
    operationalEmail: true,
    productEmail: true,
    createdAt: "",
    updatedAt: "",
    lastSeenAt: "",
  };
}

export function useOptionalSaas() {
  return useContext(SaasContext) ?? null;
}

export function useSaas() {
  const context = useOptionalSaas();
  if (!context) throw new Error("useSaas deve ser usado dentro de SaasProvider");
  return context;
}
