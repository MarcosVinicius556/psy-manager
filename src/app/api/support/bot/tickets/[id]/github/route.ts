import { NextResponse } from "next/server";
import { requireSupportBot } from "@/lib/server/support-bot-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { updateGithubLink } from "@/lib/support/store";
import { mapStoreError, readJson } from "@/lib/support/http";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = requireSupportBot(request);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });
  const { id } = await context.params;
  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return NextResponse.json({ reason: "dados_invalidos" }, { status: 400 });
  try {
    const ticket = await updateGithubLink(id, body, { uid: "grok-bot", name: "Grok Bot" });
    return NextResponse.json({ ticket });
  } catch (error) {
    return mapStoreError(error);
  }
}
