export const SUPPORT_TICKETS_COLLECTION = "supportTickets";
export const SUPPORT_COUNTER_DOC = "supportTicketCounters/global";

export const BOT_LOCK_TTL_MS = 30 * 60 * 1000;
export const BOT_MAX_FAILED_ATTEMPTS = 3;
export const STALLED_TICKET_DAYS = 7;

export const SUPPORT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

export const SUPPORT_ATTACHMENT_MIME_ALLOWLIST = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
]);
