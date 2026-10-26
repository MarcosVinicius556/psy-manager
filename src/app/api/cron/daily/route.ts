import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { dailyCronJobs } from "@/lib/server/cron/daily-jobs";
import { authorizeCron, runDailyDispatcher } from "@/lib/server/cron/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ ok: false, reason: "nao_autorizado" }, { status: 401 });
  }
  const db = getAdminDb();
  if (!db) {
    console.error("cron_daily: Firebase Admin indisponível");
    return NextResponse.json({ ok: false, reason: "admin_indisponivel" }, { status: 503 });
  }
  try {
    const results = await runDailyDispatcher(db, dailyCronJobs);
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    console.error("cron_daily", error);
    return NextResponse.json({ ok: false, reason: "falha_processamento" }, { status: 500 });
  }
}
