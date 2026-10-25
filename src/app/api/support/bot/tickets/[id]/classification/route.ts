import { NextResponse } from "next/server";
import { requireSupportBot } from "@/lib/server/support-bot-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { getTicket, updateTicketClassification } from "@/lib/support/store";
import { mapStoreError, readJson } from "@/lib/support/http";
import type { SupportClassification } from "@/lib/support/types";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = requireSupportBot(request);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });
  const { id } = await context.params;
  const body = await readJson<{ classification?: SupportClassification }>(request);
  if (body?.classification === undefined) {
    return NextResponse.json({ reason: "classification_obrigatoria" }, { status: 400 });
  }
  try {
    await updateTicketClassification(id, body.classification, { uid: "grok-bot", name: "Grok Bot" });
    const ticket = await getTicket(id);
    return NextResponse.json({ ticket });
  } catch (error) {
    return mapStoreError(error);
  }
}
