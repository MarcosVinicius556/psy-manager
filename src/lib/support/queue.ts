import type { SupportTicketRecord } from "./types";
import { BOT_LOCK_TTL_MS } from "./constants";

const PRIORITY_ORDER: Record<string, number> = {
  urgente: 0,
  alta: 1,
  media: 2,
  baixa: 3,
};

const CLASS_ORDER: Record<string, number> = {
  critico: 0,
  medio: 1,
  simples: 2,
  informativo: 3,
};

export function isBotLocked(ticket: SupportTicketRecord, now = Date.now()): boolean {
  if (!ticket.bot.lockId || !ticket.bot.lockExpiresAt) return false;
  const expires = Date.parse(ticket.bot.lockExpiresAt);
  return Number.isFinite(expires) && expires > now;
}

export function isBotQueueEligible(ticket: SupportTicketRecord, now = Date.now()): boolean {
  if (ticket.status === "encerrado" || ticket.status === "resolvido") return false;
  if (ticket.bot.state === "paused" || ticket.bot.state === "failed") return false;
  if (isBotLocked(ticket, now)) return false;
  if (ticket.status === "aguardando_informacoes") return false;
  if (ticket.status === "aguardando_aprovacao" && ticket.review.state === "pending") return false;
  if (ticket.assignee.type === "human") return false;
  return true;
}

export function compareQueueTickets(a: SupportTicketRecord, b: SupportTicketRecord): number {
  const pa = PRIORITY_ORDER[a.priority] ?? 9;
  const pb = PRIORITY_ORDER[b.priority] ?? 9;
  if (pa !== pb) return pa - pb;
  const ca = a.classification ? CLASS_ORDER[a.classification] ?? 9 : 9;
  const cb = b.classification ? CLASS_ORDER[b.classification] ?? 9 : 9;
  if (ca !== cb) return ca - cb;
  const wa = Date.parse(a.updatedAt);
  const wb = Date.parse(b.updatedAt);
  return wa - wb;
}

export function newLockExpiry(now = Date.now()) {
  return new Date(now + BOT_LOCK_TTL_MS).toISOString();
}
