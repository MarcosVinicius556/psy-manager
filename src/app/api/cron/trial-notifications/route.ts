import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { runTrialNotificationsCron } from "@/lib/server/trial-notifications-cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.warn("trial_notifications_cron: CRON_SECRET ausente");
    return false;
  }
  const header = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  return header === expected;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, reason: "nao_autorizado" }, { status: 401 });
  }
  const db = getAdminDb();
  if (!db) {
    console.error("trial_notifications_cron: Firebase Admin indisponível");
    return NextResponse.json({ ok: false, reason: "admin_indisponivel" }, { status: 503 });
  }
  try {
    const result = await runTrialNotificationsCron(db);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("trial_notifications_cron", error);
    return NextResponse.json({ ok: false, reason: "falha_processamento" }, { status: 500 });
  }
}
