import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { BOT_MAX_FAILED_ATTEMPTS, SUPPORT_COUNTER_DOC, SUPPORT_TICKETS_COLLECTION } from "./constants";
import { mapBotExecution, mapHistory, mapMessage, mapTicket } from "./mappers";
import { compareQueueTickets, isBotQueueEligible, newLockExpiry } from "./queue";
import { sanitizeTicketBody } from "./sanitize";
import { assertTransition } from "./transitions";
import type {
  SupportAttachmentMeta,
  SupportClassification,
  SupportPriority,
  SupportTicketRecord,
  SupportTicketStatus,
} from "./types";
import { deliverSupportInboxNotice, notifyAdminsOfTicket } from "./notifications";
import { signedAuthenticatedUrl } from "@/lib/server/cloudinary-sign";
import {
  ADMIN_TICKET_LIST_LIMIT,
  isFirestoreMissingIndexError,
  sortTicketsByUpdatedAtDesc,
  USER_TICKET_LIST_LIMIT,
} from "./list-queries";

function dbOrThrow() {
  const db = getAdminDb();
  if (!db) throw new Error("admin_indisponivel");
  return db;
}

function ticketRef(id: string) {
  return dbOrThrow().collection(SUPPORT_TICKETS_COLLECTION).doc(id);
}

function nowIso() {
  return new Date().toISOString();
}

async function nextHumanId() {
  const db = dbOrThrow();
  const ref = db.doc(SUPPORT_COUNTER_DOC);
  const humanId = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const seq = (snap.data()?.seq as number | undefined) ?? 0;
    const next = seq + 1;
    tx.set(ref, { seq: next }, { merge: true });
    return `CH-${String(next).padStart(6, "0")}`;
  });
  return humanId;
}

async function appendHistory(
  ticketId: string,
  event: {
    type: string;
    actor: { uid: string; name: string; role?: string };
    from?: unknown;
    to?: unknown;
    data?: Record<string, unknown>;
  }
) {
  const ref = ticketRef(ticketId).collection("history").doc();
  await ref.set({
    type: event.type,
    actor: event.actor,
    at: nowIso(),
    from: event.from ?? null,
    to: event.to ?? null,
    data: event.data ?? null,
  });
  return ref.id;
}

export async function createSupportTicket(input: {
  title: string;
  description: string;
  extraInfo: string;
  impact: string;
  openedBy: { uid: string; name: string; email: string; clinicId: string };
  attachments?: SupportAttachmentMeta[];
}) {
  const db = dbOrThrow();
  const id = db.collection(SUPPORT_TICKETS_COLLECTION).doc().id;
  const humanId = await nextHumanId();
  const createdAt = nowIso();
  const record = {
    humanId,
    title: sanitizeTicketBody(input.title, 200),
    description: sanitizeTicketBody(input.description),
    extraInfo: sanitizeTicketBody(input.extraInfo, 4000),
    impact: sanitizeTicketBody(input.impact, 500),
    openedBy: input.openedBy,
    createdAt,
    updatedAt: createdAt,
    status: "aberto",
    priority: "media",
    classification: null,
    assignee: { type: "bot", name: "Grok Bot" },
    github: {},
    bot: { state: "idle", attempts: 0 },
    review: { state: "pending" },
    version: 1,
    lastUserMessageAt: createdAt,
  };
  await ticketRef(id).set(record);
  await appendHistory(id, {
    type: "ticket_created",
    actor: { uid: input.openedBy.uid, name: input.openedBy.name, role: "user" },
    to: { status: "aberto" },
  });
  if (input.attachments?.length) {
    for (const att of input.attachments) {
      await ticketRef(id).collection("attachments").doc(att.id).set(att);
    }
  }
  const initialMessage = sanitizeTicketBody(input.description);
  if (initialMessage) {
    await addTicketMessage({
      ticketId: id,
      authorType: "user",
      authorId: input.openedBy.uid,
      authorName: input.openedBy.name,
      body: initialMessage,
      attachments: input.attachments ?? [],
      source: "app",
    });
  }
  await notifyAdminsOfTicket(db, id, "opened", "Novo chamado de suporte", `${humanId}: ${record.title}`);
  await deliverSupportInboxNotice({
    uid: input.openedBy.uid,
    ticketId: id,
    eventId: "opened_self",
    kind: "ticket_opened_admin",
    titulo: "Chamado registrado",
    corpo: `Seu chamado ${humanId} foi aberto. Acompanhe em Suporte.`,
  });
  return { id, humanId };
}

export async function getTicket(id: string): Promise<SupportTicketRecord | null> {
  const snap = await ticketRef(id).get();
  return mapTicket(id, snap.data());
}

export async function listTicketsForUser(uid: string) {
  const col = dbOrThrow().collection(SUPPORT_TICKETS_COLLECTION);
  try {
    const snap = await col.where("openedBy.uid", "==", uid).limit(USER_TICKET_LIST_LIMIT).get();
    const tickets = snap.docs.map((doc) => mapTicket(doc.id, doc.data())).filter(Boolean) as SupportTicketRecord[];
    return sortTicketsByUpdatedAtDesc(tickets).slice(0, USER_TICKET_LIST_LIMIT);
  } catch (error) {
    if (!isFirestoreMissingIndexError(error)) throw error;
    const snap = await col.where("openedBy.uid", "==", uid).limit(USER_TICKET_LIST_LIMIT).get();
    const tickets = snap.docs.map((doc) => mapTicket(doc.id, doc.data())).filter(Boolean) as SupportTicketRecord[];
    return sortTicketsByUpdatedAtDesc(tickets).slice(0, USER_TICKET_LIST_LIMIT);
  }
}

export async function listTicketsAdmin(filters: {
  status?: string;
  priority?: string;
  classification?: string;
  assignee?: string;
  from?: string;
  to?: string;
}) {
  const col = dbOrThrow().collection(SUPPORT_TICKETS_COLLECTION);
  const equalityFilters: [string, string][] = [];
  if (filters.status) equalityFilters.push(["status", filters.status]);
  if (filters.priority) equalityFilters.push(["priority", filters.priority]);
  if (filters.classification) equalityFilters.push(["classification", filters.classification]);

  let snap;
  try {
    if (equalityFilters.length === 0) {
      snap = await col.orderBy("updatedAt", "desc").limit(ADMIN_TICKET_LIST_LIMIT).get();
    } else {
      const [field, value] = equalityFilters[0];
      snap = await col.where(field, "==", value).limit(ADMIN_TICKET_LIST_LIMIT * 3).get();
    }
  } catch (error) {
    if (!isFirestoreMissingIndexError(error)) throw error;
    snap = await col.limit(ADMIN_TICKET_LIST_LIMIT * 2).get();
  }

  let tickets = snap.docs.map((doc) => mapTicket(doc.id, doc.data())).filter(Boolean) as SupportTicketRecord[];
  if (equalityFilters.length > 1) {
    tickets = tickets.filter((t) =>
      equalityFilters.every(([field, value]) => {
        if (field === "status") return t.status === value;
        if (field === "priority") return t.priority === value;
        if (field === "classification") return t.classification === value;
        return true;
      })
    );
  }
  tickets = sortTicketsByUpdatedAtDesc(tickets).slice(0, ADMIN_TICKET_LIST_LIMIT);
  if (filters.from) {
    const fromMs = Date.parse(filters.from);
    tickets = tickets.filter((t) => Date.parse(t.createdAt) >= fromMs);
  }
  if (filters.to) {
    const toMs = Date.parse(filters.to);
    tickets = tickets.filter((t) => Date.parse(t.createdAt) <= toMs);
  }
  if (filters.assignee === "bot") tickets = tickets.filter((t) => t.assignee.type === "bot");
  if (filters.assignee === "human") tickets = tickets.filter((t) => t.assignee.type === "human");
  return tickets;
}

export async function listMessages(ticketId: string) {
  const snap = await ticketRef(ticketId).collection("messages").orderBy("createdAt", "asc").get();
  return snap.docs.map((doc) => mapMessage(doc.id, doc.data())).filter(Boolean);
}

export async function listHistory(ticketId: string) {
  const snap = await ticketRef(ticketId).collection("history").orderBy("at", "asc").get();
  return snap.docs.map((doc) => mapHistory(doc.id, doc.data())).filter(Boolean);
}

export async function listBotExecutions(ticketId: string) {
  const snap = await ticketRef(ticketId).collection("botExecutions").orderBy("startedAt", "desc").limit(50).get();
  return snap.docs.map((doc) => mapBotExecution(doc.id, doc.data())).filter(Boolean);
}

export async function findMessageByIdempotency(ticketId: string, idempotencyKey: string) {
  const snap = await ticketRef(ticketId)
    .collection("messages")
    .where("idempotencyKey", "==", idempotencyKey)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return mapMessage(doc.id, doc.data());
}

export async function addTicketMessage(input: {
  ticketId: string;
  authorType: "user" | "admin" | "atendente" | "bot";
  authorId: string;
  authorName: string;
  body: string;
  attachments?: SupportAttachmentMeta[];
  source: "app" | "bot-api";
  idempotencyKey?: string;
}) {
  if (input.idempotencyKey) {
    const existing = await findMessageByIdempotency(input.ticketId, input.idempotencyKey);
    if (existing) return existing;
  }
  const body = sanitizeTicketBody(input.body);
  const ref = ticketRef(input.ticketId).collection("messages").doc();
  const createdAt = nowIso();
  const message = {
    authorType: input.authorType,
    authorId: input.authorId,
    authorName: input.authorName,
    body,
    attachments: input.attachments ?? [],
    source: input.source,
    createdAt,
    idempotencyKey: input.idempotencyKey ?? null,
  };
  await ref.set(message);
  const ticket = await getTicket(input.ticketId);
  if (!ticket) throw new Error("ticket_nao_encontrado");
  const patch: Record<string, unknown> = { updatedAt: createdAt, version: ticket.version + 1 };
  if (input.authorType === "user") patch.lastUserMessageAt = createdAt;
  else patch.lastStaffMessageAt = createdAt;
  let nextStatus = ticket.status;
  if (input.authorType === "user" && ticket.status === "aguardando_informacoes") {
    nextStatus = "em_analise";
    patch.status = nextStatus;
    await appendHistory(input.ticketId, {
      type: "status_auto",
      actor: { uid: input.authorId, name: input.authorName },
      from: { status: ticket.status },
      to: { status: nextStatus },
    });
  }
  await ticketRef(input.ticketId).update(patch);
  const notifyUid = input.authorType === "user" ? null : ticket.openedBy.uid;
  if (notifyUid) {
    await deliverSupportInboxNotice({
      uid: notifyUid,
      ticketId: input.ticketId,
      eventId: `msg_${ref.id}`,
      kind: "ticket_message",
      titulo: "Nova resposta no suporte",
      corpo: `${ticket.humanId}: nova mensagem de ${input.authorName}`,
    });
  } else {
    await notifyAdminsOfTicket(
      dbOrThrow(),
      input.ticketId,
      `msg_${ref.id}`,
      "Nova mensagem no chamado",
      `${ticket.humanId}: mensagem do usuário`
    );
  }
  return mapMessage(ref.id, message);
}

type TransitionActor = { uid: string; name: string; role?: string };

export async function transitionTicketStatus(input: {
  ticketId: string;
  to: SupportTicketStatus;
  actor: TransitionActor;
  reason?: string;
  githubMerged?: boolean;
  expectedVersion?: number;
}) {
  const ticket = await getTicket(input.ticketId);
  if (!ticket) throw new Error("ticket_nao_encontrado");
  if (input.expectedVersion !== undefined && input.expectedVersion !== ticket.version) {
    const err = new Error("conflito_versao");
    (err as Error & { code: string }).code = "conflito_versao";
    throw err;
  }
  const check = assertTransition(ticket.status, input.to, { githubMerged: input.githubMerged });
  if (!check.ok) {
    const err = new Error(check.reason);
    (err as Error & { code: string }).code = "transicao_invalida";
    throw err;
  }
  const updatedAt = nowIso();
  const patch: Record<string, unknown> = {
    status: input.to,
    updatedAt,
    version: ticket.version + 1,
  };
  if (input.to === "em_analise" && !ticket.analysisStartedAt) patch.analysisStartedAt = updatedAt;
  if (input.to === "resolvido") patch.resolvedAt = updatedAt;
  if (input.to === "encerrado") patch.closedAt = updatedAt;
  if (input.to === "reaberto") {
    patch.resolvedAt = FieldValue.delete();
    patch.closedAt = FieldValue.delete();
    patch.review = { state: "pending" };
  }
  await ticketRef(input.ticketId).update(patch);
  await appendHistory(input.ticketId, {
    type: "status_change",
    actor: input.actor,
    from: { status: ticket.status },
    to: { status: input.to, reason: input.reason ?? null },
  });
  await deliverSupportInboxNotice({
    uid: ticket.openedBy.uid,
    ticketId: input.ticketId,
    eventId: `status_${input.to}_${updatedAt}`,
    kind: "ticket_status",
    titulo: "Status do chamado atualizado",
    corpo: `${ticket.humanId} agora está em ${input.to.replace(/_/g, " ")}.`,
  });
  return getTicket(input.ticketId);
}

export async function updateTicketPriority(
  ticketId: string,
  priority: SupportPriority,
  actor: TransitionActor
) {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error("ticket_nao_encontrado");
  const updatedAt = nowIso();
  await ticketRef(ticketId).update({ priority, updatedAt, version: ticket.version + 1 });
  await appendHistory(ticketId, {
    type: "priority_change",
    actor,
    from: { priority: ticket.priority },
    to: { priority },
  });
  await deliverSupportInboxNotice({
    uid: ticket.openedBy.uid,
    ticketId,
    eventId: `priority_${priority}_${updatedAt}`,
    kind: "ticket_priority",
    titulo: "Prioridade alterada",
    corpo: `${ticket.humanId}: prioridade ${priority}.`,
  });
}

export async function updateTicketClassification(
  ticketId: string,
  classification: SupportClassification,
  actor: TransitionActor
) {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error("ticket_nao_encontrado");
  const updatedAt = nowIso();
  await ticketRef(ticketId).update({ classification, updatedAt, version: ticket.version + 1 });
  await appendHistory(ticketId, {
    type: "classification_change",
    actor,
    from: { classification: ticket.classification },
    to: { classification },
  });
}

export async function setTicketAssignee(
  ticketId: string,
  assignee: { type: "human" | "bot"; uid?: string; name: string },
  actor: TransitionActor,
  pauseBot?: boolean
) {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error("ticket_nao_encontrado");
  const updatedAt = nowIso();
  const bot = { ...ticket.bot };
  if (pauseBot || assignee.type === "human") bot.state = "paused";
  await ticketRef(ticketId).update({
    assignee,
    bot,
    updatedAt,
    version: ticket.version + 1,
  });
  await appendHistory(ticketId, {
    type: "assignee_change",
    actor,
    from: ticket.assignee,
    to: assignee,
  });
}

export async function setBotPaused(ticketId: string, paused: boolean, actor: TransitionActor) {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error("ticket_nao_encontrado");
  const bot = { ...ticket.bot, state: paused ? "paused" : "idle" };
  await ticketRef(ticketId).update({
    bot,
    updatedAt: nowIso(),
    version: ticket.version + 1,
  });
  await appendHistory(ticketId, {
    type: paused ? "bot_paused" : "bot_resumed",
    actor,
  });
}

export async function submitTicketReview(
  ticketId: string,
  decision: "approved" | "rejected",
  actor: TransitionActor,
  reason?: string
) {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error("ticket_nao_encontrado");
  if (ticket.status !== "aguardando_aprovacao") {
    const err = new Error("status_invalido");
    (err as Error & { code: string }).code = "status_invalido";
    throw err;
  }
  const updatedAt = nowIso();
  const review = {
    state: decision,
    by: actor.uid,
    at: updatedAt,
    reason: reason?.trim() || undefined,
  };
  let nextStatus: SupportTicketStatus = ticket.status;
  if (decision === "rejected") nextStatus = "reprovado";
  if (decision === "approved") {
    nextStatus = ticket.github.mergedAt ? "resolvido" : ticket.status;
  }
  await ticketRef(ticketId).update({
    review,
    status: nextStatus,
    updatedAt,
    version: ticket.version + 1,
    ...(nextStatus === "resolvido" ? { resolvedAt: updatedAt } : {}),
  });
  await appendHistory(ticketId, {
    type: decision === "approved" ? "review_approved" : "review_rejected",
    actor,
    data: { reason: reason ?? null },
  });
  await deliverSupportInboxNotice({
    uid: ticket.openedBy.uid,
    ticketId,
    eventId: `review_${decision}_${updatedAt}`,
    kind: decision === "approved" ? "ticket_resolved" : "ticket_rejected",
    titulo: decision === "approved" ? "Correção aprovada" : "Correção reprovada",
    corpo: reason ? reason.slice(0, 500) : `Revisão ${decision} em ${ticket.humanId}`,
  });
}

export async function updateGithubLink(
  ticketId: string,
  github: Record<string, unknown>,
  actor: TransitionActor
) {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error("ticket_nao_encontrado");
  const merged = { ...ticket.github, ...github };
  const updatedAt = nowIso();
  const patch: Record<string, unknown> = {
    github: merged,
    updatedAt,
    version: ticket.version + 1,
  };
  if (merged.mergedAt && ticket.status === "aguardando_aprovacao" && ticket.review.state === "approved") {
    patch.status = "resolvido";
    patch.resolvedAt = updatedAt;
  }
  if (github.prUrl && ticket.status === "em_desenvolvimento") {
    patch.status = "aguardando_aprovacao";
    patch.review = { state: "pending" };
  }
  await ticketRef(ticketId).update(patch);
  await appendHistory(ticketId, {
    type: "github_update",
    actor,
    to: merged,
  });
  if (github.issueUrl) {
    await deliverSupportInboxNotice({
      uid: ticket.openedBy.uid,
      ticketId,
      eventId: `issue_${updatedAt}`,
      kind: "ticket_issue_created",
      titulo: "Issue vinculada",
      corpo: `Issue criada para ${ticket.humanId}.`,
    });
  }
  if (github.prUrl) {
    await deliverSupportInboxNotice({
      uid: ticket.openedBy.uid,
      ticketId,
      eventId: `pr_${updatedAt}`,
      kind: "ticket_approval_requested",
      titulo: "Correção pronta para revisão",
      corpo: `PR disponível para ${ticket.humanId}.`,
    });
  }
  return getTicket(ticketId);
}

export async function logBotExecution(input: {
  ticketId: string;
  runId: string;
  startedAt: string;
  finishedAt: string;
  outcome: "success" | "failure" | "partial";
  actions: string[];
  error?: string;
  attempt: number;
}) {
  const ticket = await getTicket(input.ticketId);
  if (!ticket) throw new Error("ticket_nao_encontrado");
  const ref = ticketRef(input.ticketId).collection("botExecutions").doc();
  await ref.set({
    runId: input.runId,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    outcome: input.outcome,
    actions: input.actions,
    error: input.error ?? null,
    attempt: input.attempt,
  });
  const bot = { ...ticket.bot, lastRunAt: input.finishedAt, attempts: input.attempt };
  if (input.outcome === "failure") {
    bot.lastError = input.error ?? "falha";
    if (input.attempt >= BOT_MAX_FAILED_ATTEMPTS) {
      bot.state = "failed";
      await notifyAdminsOfTicket(
        dbOrThrow(),
        input.ticketId,
        `bot_fail_${input.runId}`,
        "Bot falhou no chamado",
        `${ticket.humanId}: ${bot.lastError}`
      );
    }
  } else {
    bot.state = "idle";
    bot.attempts = 0;
    bot.lastError = undefined;
  }
  await ticketRef(input.ticketId).update({
    bot,
    updatedAt: nowIso(),
    version: ticket.version + 1,
  });
}

export async function claimTicketForBot(ticketId: string, lockId: string) {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error("ticket_nao_encontrado");
  const now = Date.now();
  if (ticket.bot.lockId && ticket.bot.lockExpiresAt && Date.parse(ticket.bot.lockExpiresAt) > now) {
    const err = new Error("locked");
    (err as Error & { code: string }).code = "locked";
    throw err;
  }
  const expiresAt = newLockExpiry(now);
  await ticketRef(ticketId).update({
    bot: {
      ...ticket.bot,
      state: "running",
      lockId,
      lockExpiresAt: expiresAt,
    },
    updatedAt: nowIso(),
    version: ticket.version + 1,
  });
  return { lockId, lockExpiresAt: expiresAt };
}

export async function releaseTicketLock(ticketId: string, lockId: string) {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error("ticket_nao_encontrado");
  if (ticket.bot.lockId !== lockId) {
    const err = new Error("lock_invalido");
    (err as Error & { code: string }).code = "lock_invalido";
    throw err;
  }
  await ticketRef(ticketId).update({
    bot: {
      ...ticket.bot,
      state: ticket.bot.state === "running" ? "idle" : ticket.bot.state,
      lockId: FieldValue.delete(),
      lockExpiresAt: FieldValue.delete(),
    },
    updatedAt: nowIso(),
    version: ticket.version + 1,
  });
}

export async function getBotQueue(summaryOnly: boolean) {
  const snap = await dbOrThrow().collection(SUPPORT_TICKETS_COLLECTION).orderBy("updatedAt", "desc").limit(300).get();
  const tickets = snap.docs.map((doc) => mapTicket(doc.id, doc.data())).filter(Boolean) as SupportTicketRecord[];
  const eligible = tickets.filter((t) => isBotQueueEligible(t)).sort(compareQueueTickets);
  if (summaryOnly) {
    const maxUpdatedAt = eligible.reduce((max, t) => (t.updatedAt > max ? t.updatedAt : max), "");
    return { count: eligible.length, maxUpdatedAt };
  }
  return { tickets: eligible };
}

export async function attachmentSignedUrls(ticketId: string, requesterUid: string, staff: boolean) {
  const ticket = await getTicket(ticketId);
  if (!ticket) return [];
  if (!staff && ticket.openedBy.uid !== requesterUid) return [];
  const snap = await ticketRef(ticketId).collection("attachments").get();
  const urls: { id: string; url: string; nome: string; mime: string }[] = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    const publicId = data.publicId as string;
    if (!publicId) continue;
    const resourceType = String(data.mime ?? "").startsWith("image/") ? "image" : "raw";
    const url = signedAuthenticatedUrl({ publicId, resourceType });
    urls.push({ id: doc.id, url, nome: data.nome as string, mime: data.mime as string });
  }
  return urls;
}

export async function addTicketAttachments(ticketId: string, attachments: SupportAttachmentMeta[]) {
  for (const att of attachments) {
    await ticketRef(ticketId).collection("attachments").doc(att.id).set(att);
  }
}

export async function reopenTicket(ticketId: string, actor: TransitionActor, reason: string) {
  await transitionTicketStatus({
    ticketId,
    to: "reaberto",
    actor,
    reason,
  });
  await transitionTicketStatus({
    ticketId,
    to: "em_analise",
    actor,
    reason,
  });
}
