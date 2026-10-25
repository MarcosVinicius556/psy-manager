import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/server/require-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { addTicketAttachments, getTicket } from "@/lib/support/store";
import { readJson } from "@/lib/support/http";
import { validateAttachmentMeta } from "@/lib/support/attachments";
import type { SupportAttachmentMeta } from "@/lib/support/types";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });
  const { id } = await context.params;
  const ticket = await getTicket(id);
  if (!ticket) return NextResponse.json({ reason: "nao_encontrado" }, { status: 404 });
  if (ticket.openedBy.uid !== auth.uid) return NextResponse.json({ reason: "proibido" }, { status: 403 });
  const body = await readJson<{ attachments?: SupportAttachmentMeta[] }>(request);
  const attachments = body?.attachments ?? [];
  for (const att of attachments) {
    const err = validateAttachmentMeta(att);
    if (err) return NextResponse.json({ reason: "anexo_invalido", detail: err }, { status: 400 });
  }
  await addTicketAttachments(id, attachments);
  return NextResponse.json({ ok: true });
}
