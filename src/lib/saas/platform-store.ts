import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/admin/firebase";

export async function confirmSubscriptionPixPayment(targetUid: string) {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Entre novamente para continuar.");
  const token = await user.getIdToken();
  const response = await fetch("/api/platform/billing/confirm-pix", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ targetUid }),
  });
  const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
  if (!response.ok) throw new Error(data.message || "Não foi possível confirmar o pagamento.");
  return data;
}
import type { ActivationEventName, ActivationEventRecord } from "./activation-events";
import { mapAccount, mapInbox, mapPlan, type InboxItem } from "./account-store";
import {
  applyAdminAction,
  DEFAULT_PLANS,
  type AccountRecord,
  type AdminAction,
  type PlanDefinition,
} from "./model";

const ACTION_EVENT: Record<AdminAction, string> = {
  estender_trial: "extensao_trial",
  encerrar_trial: "encerramento_trial",
  alterar_plano: "alteracao_plano",
  suspender: "suspensao",
  reativar: "reativacao",
  desativar: "desativacao",
  conceder_cortesia: "cortesia",
  encerrar_cortesia: "encerramento_cortesia",
};

export type AuditEntry = {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  targetUid: string;
  at: string;
  result: string;
  summary: string;
};

export type BillingEntry = {
  id: string;
  tipo: string;
  resultado: string;
  planId: string;
  at: string;
  summary: string;
};

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function listActivationEvents() {
  const snapshot = await getDocs(collection(getFirebaseDb(), "activationEvents"));
  return snapshot.docs
    .map((item) => {
      const data = item.data();
      const event = text(data.event) as ActivationEventName;
      return {
        id: item.id,
        accountId: text(data.accountId),
        event,
        at: text(data.at),
      } satisfies ActivationEventRecord;
    })
    .filter((item) => item.accountId && item.at && item.event)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export async function listManagedAccounts() {
  const snapshot = await getDocs(collection(getFirebaseDb(), "users"));
  return snapshot.docs
    .map((item) => mapAccount(item.id, item.data()))
    .filter((account) => account.role !== "super_admin")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAudit(targetUid = "") {
  const snapshot = await getDocs(collection(getFirebaseDb(), "platformAudit"));
  return snapshot.docs
    .map((item) => {
      const data = item.data();
      return {
        id: item.id,
        actorUid: text(data.actorUid),
        actorEmail: text(data.actorEmail),
        action: text(data.action),
        targetUid: text(data.targetUid),
        at: text(data.at),
        result: text(data.result),
        summary: text(data.summary),
      } satisfies AuditEntry;
    })
    .filter((item) => !targetUid || item.targetUid === targetUid)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export async function listBillingEvents(uid: string) {
  const snapshot = await getDocs(collection(getFirebaseDb(), "users", uid, "billingEvents"));
  return snapshot.docs
    .map((item) => {
      const data = item.data();
      return {
        id: item.id,
        tipo: text(data.tipo),
        resultado: text(data.resultado),
        planId: text(data.planId),
        at: text(data.at),
        summary: text(data.summary),
      } satisfies BillingEntry;
    })
    .sort((a, b) => b.at.localeCompare(a.at));
}

export async function commitAdminAction(account: AccountRecord, action: AdminAction, input: { days?: number; planId?: string }) {
  const actor = getFirebaseAuth().currentUser;
  if (!actor?.email) throw new Error("Entre novamente para continuar.");
  const now = Date.now();
  const result = applyAdminAction(account, action, { ...input, now });
  const next = result.account;
  await updateDoc(doc(getFirebaseDb(), "users", account.uid), {
    accountStatus: next.accountStatus,
    subscriptionStatus: next.subscriptionStatus,
    billingAccess: next.billingAccess,
    planId: next.planId,
    trialStartedAt: next.trialStartedAt,
    trialEndsAt: next.trialEndsAt,
    trialStartedAtMillis: next.trialStartedAtMillis,
    trialEndsAtMillis: next.trialEndsAtMillis,
    updatedAt: next.updatedAt,
  });
  const at = next.updatedAt;
  await setDoc(doc(collection(getFirebaseDb(), "users", account.uid, "billingEvents")), {
    tipo: ACTION_EVENT[action],
    resultado: "registrado",
    planId: next.planId,
    at,
    summary: result.summary,
  });
  await setDoc(doc(collection(getFirebaseDb(), "platformAudit")), {
    actorUid: actor.uid,
    actorEmail: actor.email,
    action,
    targetUid: account.uid,
    targetEmail: account.email,
    at,
    result: "ok",
    summary: result.summary,
  });
  return result;
}

export async function loadRemotePlans() {
  const snapshot = await getDocs(collection(getFirebaseDb(), "plans"));
  return snapshot.docs
    .map((item) => mapPlan(item.id, item.data()))
    .filter((item): item is PlanDefinition => Boolean(item))
    .sort((a, b) => a.ordem - b.ordem);
}

export async function publishDefaultPlans() {
  for (const plan of DEFAULT_PLANS) {
    const ref = doc(getFirebaseDb(), "plans", plan.id);
    const current = await getDoc(ref);
    if (!current.exists()) await setDoc(ref, plan);
  }
}

export async function savePlan(plan: PlanDefinition) {
  const current = await getDoc(doc(getFirebaseDb(), "plans", plan.id));
  if (!current.exists()) throw new Error("Publique o catálogo antes de editar um plano.");
  await updateDoc(doc(getFirebaseDb(), "plans", plan.id), {
    nome: plan.nome.trim(),
    descricao: plan.descricao.trim(),
    precoCentavos: plan.precoCentavos,
    periodicidade: plan.periodicidade,
    disponivel: plan.disponivel,
    limiteProfissionais: plan.limiteProfissionais,
    updatedAt: new Date().toISOString(),
  });
  await setDoc(doc(collection(getFirebaseDb(), "platformAudit")), {
    actorUid: getFirebaseAuth().currentUser?.uid || "",
    actorEmail: getFirebaseAuth().currentUser?.email || "",
    action: "alterar_catalogo",
    targetUid: plan.id,
    at: new Date().toISOString(),
    result: "ok",
    summary: `Catálogo do plano ${plan.nome} atualizado. Nenhuma cobrança foi disparada.`,
  });
}

export async function sendPlatformMessage(input: {
  accounts: AccountRecord[];
  titulo: string;
  corpo: string;
  categoria: "operacional" | "produto";
}) {
  const actor = getFirebaseAuth().currentUser;
  if (!actor) throw new Error("Entre novamente para continuar.");
  const at = new Date().toISOString();
  const messageRef = doc(collection(getFirebaseDb(), "platformMessages"));
  await setDoc(messageRef, {
    titulo: input.titulo.trim(),
    corpo: input.corpo.trim(),
    categoria: input.categoria,
    audiencia: input.accounts.length,
    status: "registrando",
    enviados: 0,
    falhas: 0,
    createdAt: at,
    actorUid: actor.uid,
  });
  let inboxCount = 0;
  for (const account of input.accounts) {
    const ref = doc(getFirebaseDb(), "users", account.uid, "inbox", messageRef.id);
    const current = await getDoc(ref);
    if (current.exists()) continue;
    await setDoc(ref, {
      kind: "admin",
      categoria: input.categoria,
      titulo: input.titulo.trim(),
      corpo: input.corpo.trim(),
      lida: false,
      emailResult: "pendente",
      createdAt: at,
    });
    inboxCount += 1;
  }
  await setDoc(doc(collection(getFirebaseDb(), "platformAudit")), {
    actorUid: actor.uid,
    actorEmail: actor.email || "",
    action: "enviar_notificacao",
    targetUid: messageRef.id,
    at,
    result: "ok",
    summary: `Comunicado registrado para ${input.accounts.length} contas. O e-mail depende do provedor.`,
  });
  return { id: messageRef.id, inboxCount };
}

export async function setInboxEmailResult(uid: string, messageId: string, emailResult: string) {
  await updateDoc(doc(getFirebaseDb(), "users", uid, "inbox", messageId), { emailResult });
}

export async function finishPlatformMessage(id: string, enviados: number, falhas: number) {
  await updateDoc(doc(getFirebaseDb(), "platformMessages", id), {
    status: "concluido",
    enviados,
    falhas,
    concluidoEm: new Date().toISOString(),
  });
}

export async function listPlatformMessages() {
  const snapshot = await getDocs(collection(getFirebaseDb(), "platformMessages"));
  return snapshot.docs
    .map((item) => {
      const data = item.data();
      return {
        id: item.id,
        titulo: text(data.titulo),
        corpo: text(data.corpo),
        categoria: text(data.categoria),
        audiencia: Number(data.audiencia) || 0,
        status: text(data.status),
        enviados: Number(data.enviados) || 0,
        falhas: Number(data.falhas) || 0,
        createdAt: text(data.createdAt),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAccountInbox(uid: string): Promise<InboxItem[]> {
  const snapshot = await getDocs(collection(getFirebaseDb(), "users", uid, "inbox"));
  return snapshot.docs.map((item) => mapInbox(item.id, item.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
