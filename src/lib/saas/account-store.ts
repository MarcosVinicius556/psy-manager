import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { collection, doc, getDoc, getDocs, runTransaction, setDoc, updateDoc, type DocumentData } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/admin/firebase";
import { recordActivationEvent } from "./activation-events";
import {
  buildReplayDeniedAccount,
  buildTrialAccount,
  checkoutPatch,
  emptyAccount,
  expirePatch,
  noticesDue,
  noticeContent,
  userCancelPatch,
  type AccountRecord,
  type AccountStatus,
  type BillingAccess,
  type NoticeKind,
  type PlanDefinition,
  type SubscriptionStatus,
  DEFAULT_PLANS,
} from "./model";

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function mapAccount(uid: string, data: DocumentData | undefined): AccountRecord {
  const base = emptyAccount(uid, text(data?.email));
  if (!data) return base;
  const subscription = text(data.subscriptionStatus) as SubscriptionStatus | "";
  const billing = text(data.billingAccess) as BillingAccess | "";
  const accountStatus = text(data.accountStatus) as AccountStatus | "";
  return {
    ...base,
    email: text(data.email) || base.email,
    nome: text(data.nome),
    clinicName: text(data.clinicName),
    role:
      data.role === "super_admin" ? "super_admin" : data.role === "support" ? "support" : "psicologo",
    accountStatus: accountStatus === "ativa" || accountStatus === "suspensa" || accountStatus === "desativada" ? accountStatus : "",
    subscriptionStatus: subscription,
    billingAccess: billing === "trial" || billing === "integral" || billing === "restrito" || billing === "legado" ? billing : "",
    planId: text(data.planId),
    trialStartedAt: text(data.trialStartedAt),
    trialEndsAt: text(data.trialEndsAt),
    trialStartedAtMillis: number(data.trialStartedAtMillis),
    trialEndsAtMillis: number(data.trialEndsAtMillis),
    termsAcceptedAt: text(data.termsAcceptedAt),
    termsVersion: text(data.termsVersion),
    privacyAcknowledgedAt: text(data.privacyAcknowledgedAt),
    checkoutStatus:
      data.checkoutStatus === "aguardando_provedor"
        ? "aguardando_provedor"
        : data.checkoutStatus === "aguardando_confirmacao_pix"
          ? "aguardando_confirmacao_pix"
          : "",
    checkoutPlanId: text(data.checkoutPlanId),
    checkoutRequestedAt: text(data.checkoutRequestedAt),
    cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
    accessUntilMillis: number(data.accessUntilMillis),
    canceledAt: text(data.canceledAt),
    cancelReason: text(data.cancelReason),
    paidUntilMillis: number(data.paidUntilMillis),
    onboardingDismissed: Boolean(data.onboardingDismissed),
    operationalEmail: data.operationalEmail !== false,
    productEmail: data.productEmail !== false,
    createdAt: text(data.createdAt),
    updatedAt: text(data.updatedAt),
    lastSeenAt: text(data.lastSeenAt),
  };
}

export function mapPlan(id: string, data: DocumentData): PlanDefinition | null {
  const nome = text(data.nome);
  if (!nome) return null;
  const periodicidade = data.periodicidade === "anual" || data.periodicidade === "trial" ? data.periodicidade : "mensal";
  return {
    id,
    nome,
    descricao: text(data.descricao),
    precoCentavos: typeof data.precoCentavos === "number" ? data.precoCentavos : null,
    moeda: "BRL",
    periodicidade,
    trialDias: number(data.trialDias),
    recursos: Array.isArray(data.recursos) ? data.recursos.filter((item): item is string => typeof item === "string") : [],
    itensInclusos: Array.isArray(data.itensInclusos)
      ? data.itensInclusos.filter((item): item is string => typeof item === "string")
      : undefined,
    descontoAnualPct: typeof data.descontoAnualPct === "number" ? data.descontoAnualPct : undefined,
    destaque: typeof data.destaque === "boolean" ? data.destaque : undefined,
    limiteProfissionais: typeof data.limiteProfissionais === "number" ? data.limiteProfissionais : null,
    disponivel: data.disponivel !== false,
    ordem: number(data.ordem),
  };
}

export async function readAccount(uid: string) {
  const snapshot = await getDoc(doc(getFirebaseDb(), "users", uid));
  return { exists: snapshot.exists(), account: mapAccount(uid, snapshot.data()) };
}

export async function reconcileAccount(account: AccountRecord) {
  const now = Date.now();
  if (account.subscriptionStatus === "trial_ativo" && account.trialEndsAtMillis > 0 && account.trialEndsAtMillis <= now) {
    await updateDoc(doc(getFirebaseDb(), "users", account.uid), expirePatch(new Date(now).toISOString()));
    return { ...account, ...expirePatch(new Date(now).toISOString()) };
  }
  return account;
}

export async function touchLastSeen(uid: string, previous: string) {
  const elapsed = Date.now() - Date.parse(previous || "0");
  if (Number.isFinite(elapsed) && elapsed < 15 * 60 * 1000) return;
  await updateDoc(doc(getFirebaseDb(), "users", uid), { lastSeenAt: new Date().toISOString() });
}

export async function loadPlans() {
  const snapshot = await getDocs(collection(getFirebaseDb(), "plans"));
  const plans = snapshot.docs
    .map((item) => mapPlan(item.id, item.data()))
    .filter((item): item is PlanDefinition => Boolean(item))
    .sort((a, b) => a.ordem - b.ordem);
  return plans;
}

export async function reserveTrial(email: string, uid: string) {
  const ref = doc(getFirebaseDb(), "trialClaims", email);
  try {
    return await runTransaction(getFirebaseDb(), async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.exists()) return snapshot.data().uid === uid;
      transaction.set(ref, { email, uid, ownerUid: uid, createdAt: new Date().toISOString() });
      return true;
    });
  } catch (error) {
    if (error instanceof FirebaseError && error.code === "permission-denied") {
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) return snapshot.data().uid === uid;
    }
    throw error;
  }
}

export async function registerWorkspace(input: { nome: string; email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const auth = getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, input.password);
  await updateProfile(credential.user, { displayName: input.nome.trim() });
  const uid = credential.user.uid;
  const now = Date.now();
  const stamp = new Date(now).toISOString();
  let eligible = true;
  try {
    eligible = await reserveTrial(email, uid);
    const account = eligible
      ? buildTrialAccount({ uid, email, nome: input.nome, clinicName: "", now, termsAcceptedAt: stamp })
      : buildReplayDeniedAccount({ uid, email, nome: input.nome, clinicName: "", now, termsAcceptedAt: stamp });
    await setDoc(doc(getFirebaseDb(), "users", uid), account);
    await setDoc(doc(collection(getFirebaseDb(), "members")), {
      uid,
      ownerUid: uid,
      email,
      nome: input.nome.trim(),
      telefone: "",
      foto: "",
      valorBase: 0,
      valorSocial: 0,
      workHours: [],
      ativo: true,
      createdAt: stamp,
    });
    await setDoc(doc(getFirebaseDb(), "directory", email), { uid, email, nome: input.nome.trim(), foto: "", ownerUid: uid });
    await recordActivationEvent(uid, "signup", stamp);
  } catch (error) {
    console.error(error);
    throw new Error("A conta de acesso foi criada, mas o ambiente não foi concluído. Entre com o mesmo e-mail para tentar de novo.");
  }
  try {
    await sendEmailVerification(credential.user);
  } catch (error) {
    console.error(error);
  }
  return { uid, eligible };
}

export async function saveProfile(uid: string, patch: { nome?: string; clinicName?: string; onboardingDismissed?: boolean; operationalEmail?: boolean; productEmail?: boolean }) {
  await updateDoc(doc(getFirebaseDb(), "users", uid), { ...patch, updatedAt: new Date().toISOString() });
}

export async function requestCheckout(account: AccountRecord, planId: string) {
  if (account.checkoutStatus === "aguardando_provedor" && account.checkoutPlanId === planId) {
    return { created: false as const };
  }
  const nowIso = new Date().toISOString();
  const patch = checkoutPatch(planId, nowIso);
  await updateDoc(doc(getFirebaseDb(), "users", account.uid), patch);
  await setDoc(doc(collection(getFirebaseDb(), "users", account.uid, "billingEvents")), {
    tipo: "checkout_solicitado",
    resultado: "registrado",
    planId,
    at: nowIso,
    summary: "Contratação solicitada. Nenhum pagamento foi confirmado porque o provedor não está configurado.",
  });
  return { created: true as const };
}

export async function cancelOwnPlan(account: AccountRecord, reason?: string) {
  const nowIso = new Date().toISOString();
  const patch = userCancelPatch(account, nowIso, { reason });
  await updateDoc(doc(getFirebaseDb(), "users", account.uid), patch);
  const paidEnd =
    "accessUntilMillis" in patch && patch.accessUntilMillis
      ? new Date(patch.accessUntilMillis).toLocaleString("pt-BR")
      : "";
  await setDoc(doc(collection(getFirebaseDb(), "users", account.uid, "billingEvents")), {
    tipo: "cancelamento_solicitado",
    resultado: "registrado",
    planId: account.planId,
    at: nowIso,
    summary: paidEnd
      ? `Cancelamento agendado. O acesso integral segue até ${paidEnd}. Depois disso a conta fica só para consulta e exportação.`
      : "Cancelamento feito pelo profissional. Os dados do consultório permanecem para consulta e exportação.",
  });
  try {
    await fetch("/api/account/cancel-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason?.trim() || "" }),
    });
  } catch (error) {
    console.error("cancel_confirmation_email", error);
  }
}

export type InboxItem = {
  id: string;
  kind: string;
  categoria: string;
  titulo: string;
  corpo: string;
  lida: boolean;
  emailResult: string;
  createdAt: string;
};

export function mapInbox(id: string, data: DocumentData): InboxItem {
  return {
    id,
    kind: text(data.kind),
    categoria: text(data.categoria),
    titulo: text(data.titulo),
    corpo: text(data.corpo),
    lida: Boolean(data.lida),
    emailResult: text(data.emailResult),
    createdAt: text(data.createdAt),
  };
}

export async function listInbox(uid: string) {
  const snapshot = await getDocs(collection(getFirebaseDb(), "users", uid, "inbox"));
  return snapshot.docs.map((item) => mapInbox(item.id, item.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markInboxRead(uid: string, id: string) {
  await updateDoc(doc(getFirebaseDb(), "users", uid, "inbox", id), { lida: true, lidaEm: new Date().toISOString() });
}

export async function ensureNotices(account: AccountRecord, existingIds: string[]) {
  const now = Date.now();
  const due = noticesDue(account, now, existingIds);
  const created: NoticeKind[] = [];
  for (const kind of due) {
    const content = noticeContent(kind, account);
    const ref = doc(getFirebaseDb(), "users", account.uid, "inbox", kind);
    const current = await getDoc(ref);
    if (current.exists()) {
      if (text(current.data().emailResult) === "pendente") created.push(kind);
      continue;
    }
    await setDoc(ref, {
      kind,
      categoria: content.categoria,
      titulo: content.titulo,
      corpo: content.corpo,
      lida: false,
      emailResult: "pendente",
      createdAt: new Date().toISOString(),
    });
    created.push(kind);
  }
  return created;
}

export async function setNoticeEmailResult(uid: string, id: string, emailResult: string) {
  await updateDoc(doc(getFirebaseDb(), "users", uid, "inbox", id), { emailResult });
}

export function registerError(error: unknown) {
  if (error instanceof FirebaseError) {
    const messages: Record<string, string> = {
      "auth/email-already-in-use": "Este e-mail já está cadastrado. Entre ou recupere a senha.",
      "auth/invalid-email": "E-mail inválido.",
      "auth/weak-password": "A senha precisa ter pelo menos 8 caracteres.",
      "auth/too-many-requests": "Muitas tentativas. Aguarde e tente de novo.",
      "auth/network-request-failed": "Falha de conexão.",
    };
    return messages[error.code] || "Não foi possível concluir o cadastro.";
  }
  return error instanceof Error ? error.message : "Não foi possível concluir o cadastro.";
}

export function publishedOrDefault(plans: PlanDefinition[]) {
  return plans.length ? plans : DEFAULT_PLANS;
}
