import { NextResponse } from "next/server";
import { requireSupportBot } from "@/lib/server/support-bot-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { addTicketMessage } from "@/lib/support/store";
import { mapStoreError, readJson } from "@/lib/support/http";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = requireSupportBot(request);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });
  const { id } = await context.params;
  const body = await readJson<{ body?: string; idempotencyKey?: string }>(request);
  if (!body?.body?.trim()) return NextResponse.json({ reason: "mensagem_vazia" }, { status: 400 });
  if (!body.idempotencyKey?.trim()) return NextResponse.json({ reason: "idempotency_obrigatorio" }, { status: 400 });
  try {
    const message = await addTicketMessage({
      ticketId: id,
      authorType: "bot",
      authorId: "grok-bot",
      authorName: "Grok Bot",
      body: body.body,
      source: "bot-api",
      idempotencyKey: body.idempotencyKey.trim(),
    });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return mapStoreError(error);
  }
}
