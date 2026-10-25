import type { SupportTicketRecord } from "./types";

export const USER_TICKET_LIST_LIMIT = 100;
export const ADMIN_TICKET_LIST_LIMIT = 200;

export function sortTicketsByUpdatedAtDesc(tickets: SupportTicketRecord[]): SupportTicketRecord[] {
  return [...tickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Firestore gRPC code 9 = FAILED_PRECONDITION (often missing composite index). */
export function isFirestoreMissingIndexError(error: unknown): boolean {
  const code = (error as { code?: number })?.code;
  const message = error instanceof Error ? error.message : String(error);
  return code === 9 || /requires an index/i.test(message) || /FAILED_PRECONDITION/i.test(message);
}
