import { NextResponse } from "next/server";
import { requireSupportBot } from "@/lib/server/support-bot-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { getTicket, transitionTicketStatus } from "@/lib/support/store";
import { mapStoreError, readJson } from "@/lib/support/http";
import type { SupportTicketStatus } from "@/lib/support/types";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = requireSupportBot(request);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });
  const { id } = await context.params;
  const body = await readJson<{ status?: SupportTicketStatus; reason?: string; githubMerged?: boolean }>(request);
  if (!body?.status) return NextResponse.json({ reason: "status_obrigatorio" }, { status: 400 });
  const ticket = await getTicket(id);
  if (!ticket) return NextResponse.json({ reason: "nao_encontrado" }, { status: 404 });
  try {
    const updated = await transitionTicketStatus({
      ticketId: id,
      to: body.status,
      actor: { uid: "grok-bot", name: "Grok Bot", role: "bot" },
      reason: body.reason,
      githubMerged: body.githubMerged ?? Boolean(ticket.github.mergedAt),
      expectedVersion: ticket.version,
    });
    return NextResponse.json({ ticket: updated });
  } catch (error) {
    return mapStoreError(error);
  }
}
