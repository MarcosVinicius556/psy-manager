import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { applySessionConfirmation } from "@/lib/server/apply-session-confirmation";
import { clientIpFromRequest } from "@/lib/server/client-ip";
import {
  enforcePublicFeedbackGetRateLimit,
  enforcePublicFeedbackPostRateLimit,
} from "@/lib/server/public-feedback-rate-limit";
import {
  isValidSessionConfirmationToken,
  toPublicSessionConfirmationView,
} from "@/lib/server/session-confirmation";

type RouteContext = { params: Promise<{ token: string }> };

function invalidTokenResponse() {
  return NextResponse.json({ error: "Link inválido." }, { status: 404 });
}

export async function GET(request: Request, context: RouteContext) {
  const { token: rawToken } = await context.params;
  const token = typeof rawToken === "string" ? rawToken.trim() : "";
  if (!isValidSessionConfirmationToken(token)) return invalidTokenResponse();

  const ip = clientIpFromRequest(request);
  const limited = await enforcePublicFeedbackGetRateLimit(ip);
  if (limited) return limited;

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }

  const snap = await db.collection("sessionConfirmations").doc(token).get();
  if (!snap.exists) return invalidTokenResponse();

  const data = snap.data() || {};
  if (data.status === "pendente" && typeof data.expiresAtMillis === "number" && data.expiresAtMillis <= Date.now()) {
    return NextResponse.json(toPublicSessionConfirmationView({ ...data, expired: true }));
  }
  return NextResponse.json(toPublicSessionConfirmationView(data));
}

export async function POST(request: Request, context: RouteContext) {
  const { token: rawToken } = await context.params;
  const token = typeof rawToken === "string" ? rawToken.trim() : "";
  if (!isValidSessionConfirmationToken(token)) return invalidTokenResponse();

  const ip = clientIpFromRequest(request);
  const limited = await enforcePublicFeedbackPostRateLimit(ip, token);
  if (limited) return limited;

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const action = payload.action === "remarcar" ? "remarcar" : payload.action === "confirmar" ? "confirmar" : null;
  if (!action) {
    return NextResponse.json({ error: "Escolha confirmar ou remarcar." }, { status: 400 });
  }

  try {
    await applySessionConfirmation(db, token, action === "confirmar" ? "confirmada" : "remarcar");
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    if (reason === "missing") return invalidTokenResponse();
    if (reason === "answered") {
      return NextResponse.json({ error: "Este link já foi usado." }, { status: 409 });
    }
    if (reason === "expired") {
      return NextResponse.json({ error: "Este link expirou." }, { status: 410 });
    }
    console.error("Erro ao confirmar sessão:", error);
    return NextResponse.json({ error: "Não foi possível registrar." }, { status: 500 });
  }

  return NextResponse.json({ success: true, action });
}
