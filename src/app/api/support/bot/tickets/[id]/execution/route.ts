import { NextResponse } from "next/server";
import { requireSupportBot } from "@/lib/server/support-bot-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { getTicket, logBotExecution } from "@/lib/support/store";
import { mapStoreError, readJson } from "@/lib/support/http";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = requireSupportBot(request);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });
  const { id } = await context.params;
  const body = await readJson<{
    runId?: string;
    startedAt?: string;
    finishedAt?: string;
    outcome?: "success" | "failure" | "partial";
    actions?: string[];
    error?: string;
    attempt?: number;
  }>(request);
  if (!body?.runId || !body.startedAt || !body.finishedAt || !body.outcome) {
    return NextResponse.json({ reason: "dados_invalidos" }, { status: 400 });
  }
  try {
    await logBotExecution({
      ticketId: id,
      runId: body.runId,
      startedAt: body.startedAt,
      finishedAt: body.finishedAt,
      outcome: body.outcome,
      actions: body.actions ?? [],
      error: body.error,
      attempt: body.attempt ?? 1,
    });
    const ticket = await getTicket(id);
    return NextResponse.json({ ticket });
  } catch (error) {
    return mapStoreError(error);
  }
}
