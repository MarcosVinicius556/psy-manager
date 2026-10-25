import type { DocumentData } from "firebase-admin/firestore";
import type {
  SupportAttachmentMeta,
  SupportBotExecution,
  SupportHistoryEvent,
  SupportTicketBot,
  SupportTicketGithub,
  SupportTicketMessage,
  SupportTicketOpenedBy,
  SupportTicketRecord,
  SupportTicketReview,
} from "./types";

function str(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function mapOpenedBy(data: unknown): SupportTicketOpenedBy {
  const raw = (data ?? {}) as DocumentData;
  return {
    uid: str(raw.uid),
    name: str(raw.name),
    email: str(raw.email),
    clinicId: str(raw.clinicId),
  };
}

export function mapGithub(data: unknown): SupportTicketGithub {
  const raw = (data ?? {}) as DocumentData;
  return {
    issueUrl: str(raw.issueUrl) || undefined,
    issueNumber: typeof raw.issueNumber === "number" ? raw.issueNumber : undefined,
    branch: str(raw.branch) || undefined,
    prUrl: str(raw.prUrl) || undefined,
    prNumber: typeof raw.prNumber === "number" ? raw.prNumber : undefined,
    prState: str(raw.prState) || undefined,
    mergedAt: str(raw.mergedAt) || undefined,
  };
}

export function mapBot(data: unknown): SupportTicketBot {
  const raw = (data ?? {}) as DocumentData;
  const state = str(raw.state, "idle");
  return {
    state: state === "running" || state === "paused" || state === "failed" || state === "waiting_human" ? state : "idle",
    lockId: str(raw.lockId) || undefined,
    lockExpiresAt: str(raw.lockExpiresAt) || undefined,
    attempts: num(raw.attempts),
    lastRunAt: str(raw.lastRunAt) || undefined,
    lastError: str(raw.lastError) || undefined,
  };
}

export function mapReview(data: unknown): SupportTicketReview {
  const raw = (data ?? {}) as DocumentData;
  const state = str(raw.state, "pending");
  return {
    state: state === "approved" || state === "rejected" ? state : "pending",
    by: str(raw.by) || undefined,
    at: str(raw.at) || undefined,
    reason: str(raw.reason) || undefined,
  };
}

export function mapTicket(id: string, data: DocumentData | undefined): SupportTicketRecord | null {
  if (!data) return null;
  const status = str(data.status, "aberto");
  const priority = str(data.priority, "media");
  const classificationRaw = data.classification;
  const classification =
    classificationRaw === "informativo" ||
    classificationRaw === "simples" ||
    classificationRaw === "medio" ||
    classificationRaw === "critico"
      ? classificationRaw
      : null;
  const assigneeRaw = (data.assignee ?? {}) as DocumentData;
  const assigneeType = assigneeRaw.type === "human" ? "human" : "bot";
  return {
    id,
    humanId: str(data.humanId),
    title: str(data.title),
    description: str(data.description),
    extraInfo: str(data.extraInfo),
    openedBy: mapOpenedBy(data.openedBy),
    createdAt: str(data.createdAt),
    updatedAt: str(data.updatedAt),
    status: status as SupportTicketRecord["status"],
    priority: (priority === "baixa" || priority === "alta" || priority === "urgente" ? priority : "media") as SupportTicketRecord["priority"],
    classification,
    impact: str(data.impact),
    assignee: {
      type: assigneeType,
      uid: str(assigneeRaw.uid) || undefined,
      name: str(assigneeRaw.name, "Grok Bot"),
    },
    analysisStartedAt: str(data.analysisStartedAt) || undefined,
    resolvedAt: str(data.resolvedAt) || undefined,
    closedAt: str(data.closedAt) || undefined,
    github: mapGithub(data.github),
    bot: mapBot(data.bot),
    review: mapReview(data.review),
    version: num(data.version, 1),
    lastUserMessageAt: str(data.lastUserMessageAt) || undefined,
    lastStaffMessageAt: str(data.lastStaffMessageAt) || undefined,
  };
}

export function mapMessage(id: string, data: DocumentData | undefined): SupportTicketMessage | null {
  if (!data) return null;
  const authorType = str(data.authorType, "user");
  const attachments = Array.isArray(data.attachments)
    ? data.attachments
        .map((item, index) => {
          const raw = item as DocumentData;
          const meta: SupportAttachmentMeta = {
            id: str(raw.id, `att-${index}`),
            publicId: str(raw.publicId),
            mime: str(raw.mime),
            size: num(raw.size),
            nome: str(raw.nome, "anexo"),
          };
          return meta.publicId ? meta : null;
        })
        .filter((item): item is SupportAttachmentMeta => item !== null)
    : [];
  return {
    id,
    authorType: authorType as SupportTicketMessage["authorType"],
    authorId: str(data.authorId),
    authorName: str(data.authorName),
    body: str(data.body),
    attachments,
    source: str(data.source, "app") === "bot-api" ? "bot-api" : "app",
    createdAt: str(data.createdAt),
    idempotencyKey: str(data.idempotencyKey) || undefined,
  };
}

export function mapHistory(id: string, data: DocumentData | undefined): SupportHistoryEvent | null {
  if (!data) return null;
  const actor = (data.actor ?? {}) as DocumentData;
  return {
    id,
    type: str(data.type),
    actor: { uid: str(actor.uid), name: str(actor.name), role: str(actor.role) || undefined },
    at: str(data.at),
    from: data.from,
    to: data.to,
    data: typeof data.data === "object" && data.data ? (data.data as Record<string, unknown>) : undefined,
  };
}

export function mapBotExecution(id: string, data: DocumentData | undefined): SupportBotExecution | null {
  if (!data) return null;
  const outcome = str(data.outcome, "failure");
  return {
    id,
    runId: str(data.runId),
    startedAt: str(data.startedAt),
    finishedAt: str(data.finishedAt) || undefined,
    outcome: outcome === "success" || outcome === "partial" ? outcome : "failure",
    actions: Array.isArray(data.actions) ? data.actions.filter((a): a is string => typeof a === "string") : [],
    error: str(data.error) || undefined,
    attempt: num(data.attempt, 1),
  };
}
