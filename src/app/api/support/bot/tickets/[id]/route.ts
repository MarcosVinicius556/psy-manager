import { NextResponse } from "next/server";
import { requireSupportBot } from "@/lib/server/support-bot-auth";
import { enforceSupportBotLimit } from "@/lib/server/support-rate-limit";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  attachmentSignedUrls,
  getTicket,
  listBotExecutions,
  listHistory,
  listMessages,
} from "@/lib/support/store";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = requireSupportBot(request);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });
  const limited = await enforceSupportBotLimit(request.headers.get("x-forwarded-for") ?? "bot");
  if (limited) return limited;
  const { id } = await context.params;
  const ticket = await getTicket(id);
  if (!ticket) return NextResponse.json({ reason: "nao_encontrado" }, { status: 404 });
  const [messages, history, executions, signedAttachments] = await Promise.all([
    listMessages(id),
    listHistory(id),
    listBotExecutions(id),
    attachmentSignedUrls(id, "bot", true),
  ]);
  return NextResponse.json({
    ticket,
    messages,
    history,
    executions,
    signedAttachments,
    reviewReason: ticket.review.reason ?? null,
  });
}
