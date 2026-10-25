import type { SupportTicketStatus } from "./types";

const TRANSITIONS: Record<SupportTicketStatus, SupportTicketStatus[]> = {
  aberto: ["em_analise", "aguardando_informacoes", "encerrado"],
  em_analise: ["aguardando_informacoes", "em_desenvolvimento", "resolvido", "encerrado"],
  aguardando_informacoes: ["em_analise"],
  em_desenvolvimento: ["aguardando_aprovacao", "em_analise"],
  aguardando_aprovacao: ["reprovado", "resolvido"],
  reprovado: ["em_desenvolvimento"],
  resolvido: ["encerrado", "reaberto"],
  encerrado: ["reaberto"],
  reaberto: ["em_analise"],
};

export function allowedTransitions(from: SupportTicketStatus): SupportTicketStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function canTransition(from: SupportTicketStatus, to: SupportTicketStatus): boolean {
  return allowedTransitions(from).includes(to);
}

export type TransitionContext = {
  githubMerged?: boolean;
};

export function assertTransition(
  from: SupportTicketStatus,
  to: SupportTicketStatus,
  context: TransitionContext = {}
): { ok: true } | { ok: false; reason: string } {
  if (!canTransition(from, to)) {
    return { ok: false, reason: `Transição inválida: ${from} → ${to}` };
  }
  if (to === "resolvido" && from === "aguardando_aprovacao" && !context.githubMerged) {
    return { ok: false, reason: "Resolvido após aprovação exige merge de PR reportado pelo bot." };
  }
  return { ok: true };
}
