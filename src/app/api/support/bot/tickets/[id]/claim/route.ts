import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireSupportBot } from "@/lib/server/support-bot-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { claimTicketForBot } from "@/lib/support/store";
import { mapStoreError } from "@/lib/support/http";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = requireSupportBot(_request);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });
  const { id } = await context.params;
  const lockId = randomUUID();
  try {
    const lock = await claimTicketForBot(id, lockId);
    return NextResponse.json(lock);
  } catch (error) {
    return mapStoreError(error);
  }
}
