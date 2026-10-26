import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { clientIpFromRequest } from "@/lib/server/client-ip";
import {
  enforcePublicFeedbackGetRateLimit,
  enforcePublicFeedbackPostRateLimit,
} from "@/lib/server/public-feedback-rate-limit";
import { isValidPublicToken } from "@/lib/server/public-token";
import { formAnswered, formExpired, sanitizeFormAnswers, toPublicFormView } from "@/lib/server/form-public";
import { encryptFormResponses } from "@/lib/server/form-response-store";

type RouteContext = { params: Promise<{ token: string }> };

function invalid() {
  return NextResponse.json({ error: "Link inválido." }, { status: 404 });
}

export async function GET(request: Request, context: RouteContext) {
  const { token: raw } = await context.params;
  const token = raw?.trim() ?? "";
  if (!isValidPublicToken(token)) return invalid();

  const ip = clientIpFromRequest(request);
  const limited = await enforcePublicFeedbackGetRateLimit(ip);
  if (limited) return limited;

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });

  const snap = await db.collection("formRequests").doc(token).get();
  if (!snap.exists) return invalid();
  return NextResponse.json(toPublicFormView(snap.data() || {}));
}

export async function POST(request: Request, context: RouteContext) {
  const { token: raw } = await context.params;
  const token = raw?.trim() ?? "";
  if (!isValidPublicToken(token)) return invalid();

  const ip = clientIpFromRequest(request);
  const limited = await enforcePublicFeedbackPostRateLimit(ip, token);
  if (limited) return limited;

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const answersRaw =
    body && typeof body === "object" && (body as { answers?: unknown }).answers &&
    typeof (body as { answers?: unknown }).answers === "object"
      ? ((body as { answers: Record<string, unknown> }).answers as Record<string, unknown>)
      : {};

  try {
    await db.runTransaction(async (tx) => {
      const ref = db.collection("formRequests").doc(token);
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("missing");
      const data = snap.data() || {};
      if (formAnswered(data)) throw new Error("answered");
      if (formExpired(data)) throw new Error("expired");

      const view = toPublicFormView(data);
      const respostas = sanitizeFormAnswers(view.fields, answersRaw);
      const ownerUid = typeof data.ownerUid === "string" ? data.ownerUid : "";
      const patientId = typeof data.patientId === "string" ? data.patientId : "";
      const templateId = typeof data.templateId === "string" ? data.templateId : "";
      const templateVersion = Number(data.templateVersion) || 1;
      const now = Date.now();

      const stored = await encryptFormResponses(db, ownerUid, respostas);

      const responseRef = db.collection("formResponses").doc();
      tx.create(responseRef, {
        ownerUid,
        patientId,
        templateId,
        templateVersion,
        requestToken: token,
        respostas: stored.plain,
        enc: stored.enc,
        submittedAt: new Date(now).toISOString(),
        submittedAtMillis: now,
        ip,
      });

      tx.update(ref, {
        answeredAt: FieldValue.serverTimestamp(),
        answeredAtMillis: now,
        responseId: responseRef.id,
      });
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    if (reason.startsWith("missing:")) {
      return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
    }
    if (reason === "missing") return invalid();
    if (reason === "answered") return NextResponse.json({ error: "Este link já foi usado." }, { status: 409 });
    if (reason === "expired") return NextResponse.json({ error: "Este link expirou." }, { status: 410 });
    console.error("form:", error);
    return NextResponse.json({ error: "Não foi possível enviar." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
