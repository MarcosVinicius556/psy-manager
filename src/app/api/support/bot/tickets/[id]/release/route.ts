import { NextResponse } from "next/server";
import { requireSupportBot } from "@/lib/server/support-bot-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { releaseTicketLock } from "@/lib/support/store";
import { mapStoreError, readJson } from "@/lib/support/http";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = requireSupportBot(request);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });
  const { id } = await context.params;
  const body = await readJson<{ lockId?: string }>(request);
  if (!body?.lockId) return NextResponse.json({ reason: "lock_obrigatorio" }, { status: 400 });
  try {
    await releaseTicketLock(id, body.lockId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return mapStoreError(error);
  }
}
