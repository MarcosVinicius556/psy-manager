import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/server/require-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { isSupportStaffUid } from "@/lib/support/roles";
import {
  attachmentSignedUrls,
  getTicket,
  listBotExecutions,
  listHistory,
  listMessages,
} from "@/lib/support/store";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });
  const { id } = await context.params;
  const ticket = await getTicket(id);
  if (!ticket) return NextResponse.json({ reason: "nao_encontrado" }, { status: 404 });
  const staff = await isSupportStaffUid(auth.uid);
  if (!staff && ticket.openedBy.uid !== auth.uid) {
    return NextResponse.json({ reason: "proibido" }, { status: 403 });
  }
  const [messages, history, executions, signedAttachments] = await Promise.all([
    listMessages(id),
    listHistory(id),
    staff ? listBotExecutions(id) : Promise.resolve([]),
    attachmentSignedUrls(id, auth.uid, staff),
  ]);
  return NextResponse.json({ ticket, messages, history, executions, signedAttachments });
}
