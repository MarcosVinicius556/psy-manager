export type SupportTicketStatus =
  | "aberto"
  | "em_analise"
  | "aguardando_informacoes"
  | "em_desenvolvimento"
  | "aguardando_aprovacao"
  | "reprovado"
  | "resolvido"
  | "encerrado"
  | "reaberto";

export type SupportPriority = "baixa" | "media" | "alta" | "urgente";
export type SupportClassification = "informativo" | "simples" | "medio" | "critico" | null;

export type SupportAssigneeType = "human" | "bot";

export type SupportBotState = "idle" | "running" | "paused" | "failed" | "waiting_human";

export type SupportReviewState = "pending" | "approved" | "rejected";

export type SupportMessageAuthorType = "user" | "admin" | "atendente" | "bot";

export type SupportMessageSource = "app" | "bot-api";

export type SupportTicketOpenedBy = {
  uid: string;
  name: string;
  email: string;
  clinicId: string;
};

export type SupportTicketAssignee = {
  type: SupportAssigneeType;
  uid?: string;
  name: string;
};

export type SupportTicketGithub = {
  issueUrl?: string;
  issueNumber?: number;
  branch?: string;
  prUrl?: string;
  prNumber?: number;
  prState?: string;
  mergedAt?: string;
};

export type SupportTicketBot = {
  state: SupportBotState;
  lockId?: string;
  lockExpiresAt?: string;
  attempts: number;
  lastRunAt?: string;
  lastError?: string;
};

export type SupportTicketReview = {
  state: SupportReviewState;
  by?: string;
  at?: string;
  reason?: string;
};

export type SupportTicketRecord = {
  id: string;
  humanId: string;
  title: string;
  description: string;
  extraInfo: string;
  openedBy: SupportTicketOpenedBy;
  createdAt: string;
  updatedAt: string;
  status: SupportTicketStatus;
  priority: SupportPriority;
  classification: SupportClassification;
  impact: string;
  assignee: SupportTicketAssignee;
  analysisStartedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  github: SupportTicketGithub;
  bot: SupportTicketBot;
  review: SupportTicketReview;
  version: number;
  lastUserMessageAt?: string;
  lastStaffMessageAt?: string;
};

export type SupportTicketMessage = {
  id: string;
  authorType: SupportMessageAuthorType;
  authorId: string;
  authorName: string;
  body: string;
  attachments: SupportAttachmentMeta[];
  source: SupportMessageSource;
  createdAt: string;
  idempotencyKey?: string;
};

export type SupportAttachmentMeta = {
  id: string;
  publicId: string;
  mime: string;
  size: number;
  nome: string;
};

export type SupportHistoryEvent = {
  id: string;
  type: string;
  actor: { uid: string; name: string; role?: string };
  at: string;
  from?: unknown;
  to?: unknown;
  data?: Record<string, unknown>;
};

export type SupportBotExecution = {
  id: string;
  runId: string;
  startedAt: string;
  finishedAt?: string;
  outcome: "success" | "failure" | "partial";
  actions: string[];
  error?: string;
  attempt: number;
};
