import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/server/require-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { enforceSupportMessageLimit } from "@/lib/server/support-rate-limit";
import { isSupportStaffUid } from "@/lib/support/roles";
import { addTicketMessage, getTicket } from "@/lib/support/store";
import { mapStoreError, readJson } from "@/lib/support/http";
import { validateAttachmentMeta } from "@/lib/support/attachments";
import type { SupportAttachmentMeta } from "@/lib/support/types";

export const runtime = "nodejs";

type Body = { body?: string; attachments?: SupportAttachmentMeta[]; authorName?: string };

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });
  const limited = await enforceSupportMessageLimit(auth.uid);
  if (limited) return limited;
  const { id } = await context.params;
  const ticket = await getTicket(id);
  if (!ticket) return NextResponse.json({ reason: "nao_encontrado" }, { status: 404 });
  const staff = await isSupportStaffUid(auth.uid);
  const isOwner = ticket.openedBy.uid === auth.uid;
  if (!staff && !isOwner) return NextResponse.json({ reason: "proibido" }, { status: 403 });
  if (!staff && ticket.status === "encerrado") {
    return NextResponse.json({ reason: "chamado_encerrado" }, { status: 409 });
  }
  const body = await readJson<Body>(request);
  if (!body?.body?.trim()) return NextResponse.json({ reason: "mensagem_vazia" }, { status: 400 });
  for (const att of body.attachments ?? []) {
    const err = validateAttachmentMeta(att);
    if (err) return NextResponse.json({ reason: "anexo_invalido", detail: err }, { status: 400 });
  }
  try {
    const message = await addTicketMessage({
      ticketId: id,
      authorType: staff ? "atendente" : "user",
      authorId: auth.uid,
      authorName: body.authorName?.trim() || auth.email || "Usuário",
      body: body.body,
      attachments: body.attachments ?? [],
      source: "app",
    });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return mapStoreError(error);
  }
}
