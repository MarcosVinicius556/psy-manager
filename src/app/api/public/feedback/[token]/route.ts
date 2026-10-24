import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { clientIpFromRequest } from "@/lib/server/client-ip";
import {
  enforcePublicFeedbackGetRateLimit,
  enforcePublicFeedbackPostRateLimit,
} from "@/lib/server/public-feedback-rate-limit";
import {
  feedbackAnswered,
  feedbackExpired,
  isValidFeedbackToken,
  parseFeedbackRating,
  sanitizeFeedbackComment,
  toPublicFeedbackView,
} from "@/lib/server/public-session-feedback";

type RouteContext = { params: Promise<{ token: string }> };

function invalidTokenResponse() {
  return NextResponse.json({ error: "Link inválido." }, { status: 404 });
}

export async function GET(request: Request, context: RouteContext) {
  const { token: rawToken } = await context.params;
  const token = typeof rawToken === "string" ? rawToken.trim() : "";
  if (!isValidFeedbackToken(token)) return invalidTokenResponse();

  const ip = clientIpFromRequest(request);
  const limited = await enforcePublicFeedbackGetRateLimit(ip);
  if (limited) return limited;

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }

  const snap = await db.collection("sessionFeedbacks").doc(token).get();
  if (!snap.exists) return invalidTokenResponse();

  const data = snap.data() || {};
  return NextResponse.json(toPublicFeedbackView(data));
}

export async function POST(request: Request, context: RouteContext) {
  const { token: rawToken } = await context.params;
  const token = typeof rawToken === "string" ? rawToken.trim() : "";
  if (!isValidFeedbackToken(token)) return invalidTokenResponse();

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
  const stars = parseFeedbackRating(payload.stars);
  if (stars == null) {
    return NextResponse.json({ error: "Escolha de 1 a 5 estrelas." }, { status: 400 });
  }
  const comment = sanitizeFeedbackComment(typeof payload.comment === "string" ? payload.comment : "");

  try {
    await db.runTransaction(async (tx) => {
      const ref = db.collection("sessionFeedbacks").doc(token);
      const snap = await tx.get(ref);
      if (!snap.exists) {
        throw new Error("missing");
      }
      const data = snap.data() || {};
      if (feedbackAnswered(data)) {
        throw new Error("answered");
      }
      if (feedbackExpired(data)) {
        throw new Error("expired");
      }
      tx.update(ref, {
        stars,
        comment,
        answeredAt: FieldValue.serverTimestamp(),
        answeredAtMillis: Date.now(),
      });
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    if (reason === "missing") return invalidTokenResponse();
    if (reason === "answered") {
      return NextResponse.json({ error: "Este link já foi usado." }, { status: 409 });
    }
    if (reason === "expired") {
      return NextResponse.json({ error: "Este link expirou." }, { status: 410 });
    }
    console.error("Erro ao salvar feedback público:", error);
    return NextResponse.json({ error: "Não foi possível enviar." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
