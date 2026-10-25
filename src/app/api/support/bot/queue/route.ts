import { NextResponse } from "next/server";
import { requireSupportBot } from "@/lib/server/support-bot-auth";
import { enforceSupportBotLimit } from "@/lib/server/support-rate-limit";
import { getAdminDb } from "@/lib/firebase-admin";
import { getBotQueue } from "@/lib/support/store";

export const runtime = "nodejs";

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function GET(request: Request) {
  const auth = requireSupportBot(request);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });
  const limited = await enforceSupportBotLimit(clientIp(request));
  if (limited) return limited;
  const summary = new URL(request.url).searchParams.get("summary") === "1";
  const result = await getBotQueue(summary);
  return NextResponse.json(result);
}
