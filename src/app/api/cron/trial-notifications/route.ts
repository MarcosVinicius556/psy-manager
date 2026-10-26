import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { trialNotificationsJob } from "@/lib/server/cron/jobs/trial-notifications";
import { authorizeCron, runDailyJob } from "@/lib/server/cron/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mantido por compatibilidade; o dispatcher oficial é `/api/cron/daily`. */
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ ok: false, reason: "nao_autorizado" }, { status: 401 });
  }
  const db = getAdminDb();
  if (!db) {
    console.error("trial_notifications_cron: Firebase Admin indisponível");
    return NextResponse.json({ ok: false, reason: "admin_indisponivel" }, { status: 503 });
  }
  try {
    const summary = await runDailyJob(db, trialNotificationsJob);
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    console.error("trial_notifications_cron", error);
    return NextResponse.json({ ok: false, reason: "falha_processamento" }, { status: 500 });
  }
}
