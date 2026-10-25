import type { SupportPriority, SupportTicketStatus } from "./types";

export const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  aberto: "Aberto",
  em_analise: "Em análise",
  aguardando_informacoes: "Aguardando informações",
  em_desenvolvimento: "Em desenvolvimento",
  aguardando_aprovacao: "Aguardando aprovação",
  reprovado: "Reprovado",
  resolvido: "Resolvido",
  encerrado: "Encerrado",
  reaberto: "Reaberto",
};

export const PRIORITY_LABELS: Record<SupportPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export function statusLabel(status: SupportTicketStatus) {
  return STATUS_LABELS[status] ?? status;
}
