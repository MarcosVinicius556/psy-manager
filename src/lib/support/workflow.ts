import type { SupportHistoryEvent, SupportTicketRecord, SupportTicketStatus } from "./types";
import { statusLabel } from "./labels";

export type WorkflowStepState = "done" | "current" | "upcoming" | "skipped";

export type WorkflowStep = {
  id: string;
  label: string;
  state: WorkflowStepState;
  at?: string;
  detail?: string;
};

const MAIN_LIFECYCLE: { id: string; statuses: SupportTicketStatus[]; label: string }[] = [
  { id: "opened", statuses: ["aberto"], label: "Chamado aberto" },
  { id: "triage", statuses: ["em_analise", "reaberto"], label: "Triagem e análise" },
  { id: "waiting_user", statuses: ["aguardando_informacoes"], label: "Aguardando você" },
  { id: "development", statuses: ["em_desenvolvimento", "reprovado"], label: "Desenvolvimento" },
  { id: "approval", statuses: ["aguardando_aprovacao"], label: "Aguardando aprovação" },
  { id: "resolved", statuses: ["resolvido"], label: "Resolvido" },
  { id: "closed", statuses: ["encerrado"], label: "Encerrado" },
];

function stepIndexForStatus(status: SupportTicketStatus): number {
  const idx = MAIN_LIFECYCLE.findIndex((step) => step.statuses.includes(status));
  return idx >= 0 ? idx : 0;
}

function historyTimestampForStep(stepId: string, history: SupportHistoryEvent[]): string | undefined {
  const matchers: Record<string, (ev: SupportHistoryEvent) => boolean> = {
    opened: (ev) => ev.type === "ticket_created",
    triage: (ev) =>
      ev.type === "status_change" &&
      typeof ev.to === "object" &&
      ev.to !== null &&
      (ev.to as { status?: string }).status === "em_analise",
    development: (ev) =>
      ev.type === "github_update" ||
      (ev.type === "status_change" &&
        typeof ev.to === "object" &&
        (ev.to as { status?: string }).status === "em_desenvolvimento"),
    approval: (ev) =>
      ev.type === "review_approved" ||
      ev.type === "review_rejected" ||
      (ev.type === "status_change" &&
        typeof ev.to === "object" &&
        (ev.to as { status?: string }).status === "aguardando_aprovacao"),
    resolved: (ev) =>
      ev.type === "review_approved" ||
      (ev.type === "status_change" &&
        typeof ev.to === "object" &&
        (ev.to as { status?: string }).status === "resolvido"),
    closed: (ev) =>
      ev.type === "status_change" &&
      typeof ev.to === "object" &&
      (ev.to as { status?: string }).status === "encerrado",
  };
  const match = matchers[stepId];
  if (!match) return undefined;
  const hit = history.find((ev) => match(ev));
  return hit?.at;
}

export function buildWorkflowSteps(ticket: SupportTicketRecord, history: SupportHistoryEvent[]): WorkflowStep[] {
  const currentIdx = stepIndexForStatus(ticket.status);
  return MAIN_LIFECYCLE.map((step, index) => {
    let state: WorkflowStepState = "upcoming";
    if (index < currentIdx) state = "done";
    else if (index === currentIdx) state = "current";
    else if (ticket.status === "encerrado" && step.id === "closed") state = "current";

    const at = historyTimestampForStep(step.id, history) ?? (state === "current" ? ticket.updatedAt : undefined);
    let detail: string | undefined;
    if (state === "current") detail = statusLabel(ticket.status);
    if (step.id === "approval" && ticket.review.state === "rejected") detail = "Correção reprovada";
    if (step.id === "development" && ticket.github.prUrl) detail = `PR #${ticket.github.prNumber ?? "vinculado"}`;
    if (step.id === "development" && ticket.github.issueUrl) detail = `Issue #${ticket.github.issueNumber ?? "vinculada"}`;

    return { id: step.id, label: step.label, state, at, detail };
  });
}

export type ActivityItem =
  | { kind: "message"; id: string; at: string; message: import("./types").SupportTicketMessage }
  | { kind: "history"; id: string; at: string; event: SupportHistoryEvent };

export function mergeActivity(
  messages: import("./types").SupportTicketMessage[],
  history: SupportHistoryEvent[]
): ActivityItem[] {
  const items: ActivityItem[] = [
    ...messages.map((m) => ({ kind: "message" as const, id: `msg-${m.id}`, at: m.createdAt, message: m })),
    ...history
      .filter((h) => h.type !== "ticket_created")
      .map((h) => ({ kind: "history" as const, id: `hist-${h.id}`, at: h.at, event: h })),
  ];
  return items.sort((a, b) => a.at.localeCompare(b.at));
}

export function historyEventLabel(event: SupportHistoryEvent): string {
  switch (event.type) {
    case "status_change":
    case "status_auto":
      return "Status atualizado";
    case "priority_change":
      return "Prioridade alterada";
    case "classification_change":
      return "Classificação definida";
    case "assignee_change":
      return "Responsável alterado";
    case "github_update":
      return "GitHub atualizado";
    case "review_approved":
      return "Correção aprovada";
    case "review_rejected":
      return "Correção reprovada";
    case "bot_paused":
      return "Grok Bot pausado";
    case "bot_resumed":
      return "Grok Bot retomado";
    default:
      return event.type.replace(/_/g, " ");
  }
}
