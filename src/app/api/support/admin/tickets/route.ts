import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/server/require-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { isSupportStaffUid } from "@/lib/support/roles";
import { listTicketsAdmin } from "@/lib/support/store";
import { STALLED_TICKET_DAYS } from "@/lib/support/constants";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });
  if (!(await isSupportStaffUid(auth.uid))) return NextResponse.json({ reason: "proibido" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const tickets = await listTicketsAdmin({
    status: searchParams.get("status") ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
    classification: searchParams.get("classification") ?? undefined,
    assignee: searchParams.get("assignee") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });
  const stalledMs = STALLED_TICKET_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const enriched = tickets.map((t) => ({
    ...t,
    badges: {
      stalled: now - Date.parse(t.updatedAt) > stalledMs,
      botFailed: t.bot.state === "failed",
      waitingHuman: t.bot.state === "waiting_human",
    },
  }));
  return NextResponse.json({ tickets: enriched });
}
