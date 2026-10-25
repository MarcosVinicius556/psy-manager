import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

function tokenFromEnv() {
  return process.env.SUPPORT_BOT_TOKEN?.trim() ?? "";
}

export function supportBotConfigured() {
  return tokenFromEnv().length > 0;
}

function safeEqual(expected: string, provided: string) {
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function requireSupportBot(request: Request): { ok: true } | { error: NextResponse } {
  const expected = tokenFromEnv();
  if (!expected) {
    return { error: NextResponse.json({ reason: "bot_nao_configurado" }, { status: 503 }) };
  }
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const provided = match?.[1]?.trim() ?? "";
  if (!provided || !safeEqual(expected, provided)) {
    return { error: NextResponse.json({ reason: "nao_autorizado" }, { status: 401 }) };
  }
  return { ok: true };
}
