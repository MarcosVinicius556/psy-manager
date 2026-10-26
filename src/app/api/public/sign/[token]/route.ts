import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { clientIpFromRequest } from "@/lib/server/client-ip";
import {
  enforcePublicFeedbackGetRateLimit,
  enforcePublicFeedbackPostRateLimit,
} from "@/lib/server/public-feedback-rate-limit";
import { isValidPublicToken, sanitizeSignerCpf, sanitizeSignerName, sanitizeUserAgent } from "@/lib/server/public-token";
import {
  signatureContentHash,
  signatureExpired,
  signatureSigned,
  toPublicSignatureView,
} from "@/lib/server/signature-requests";
import { isValidCpf } from "@/lib/admin/cpf";

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

  const snap = await db.collection("signatureRequests").doc(token).get();
  if (!snap.exists) return invalid();
  return NextResponse.json(toPublicSignatureView(snap.data() || {}));
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
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const signerName = sanitizeSignerName(typeof payload.signerName === "string" ? payload.signerName : "");
  const signerCpf = sanitizeSignerCpf(typeof payload.signerCpf === "string" ? payload.signerCpf : "");
  const guardianName = sanitizeSignerName(typeof payload.guardianName === "string" ? payload.guardianName : "");
  const accepted = payload.accepted === true;

  if (!signerName || !accepted) {
    return NextResponse.json({ error: "Informe nome completo e confirme o aceite." }, { status: 400 });
  }
  if (!signerCpf || !isValidCpf(signerCpf)) {
    return NextResponse.json({ error: "Informe um CPF válido." }, { status: 400 });
  }

  const userAgent = sanitizeUserAgent(request.headers.get("user-agent") || "");

  try {
    await db.runTransaction(async (tx) => {
      const ref = db.collection("signatureRequests").doc(token);
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("missing");
      const data = snap.data() || {};
      if (signatureSigned(data)) throw new Error("signed");
      if (signatureExpired(data)) throw new Error("expired");

      const bodyText = typeof data.body === "string" ? data.body : "";
      const contentHash = signatureContentHash(bodyText);
      const ownerUid = typeof data.ownerUid === "string" ? data.ownerUid : "";
      const patientId = typeof data.patientId === "string" ? data.patientId : "";
      const kind = typeof data.kind === "string" ? data.kind : "tcle";
      const now = Date.now();

      tx.update(ref, {
        signedAt: FieldValue.serverTimestamp(),
        signedAtMillis: now,
        signerName,
        signerCpf,
        guardianName: guardianName || null,
        signerIp: ip,
        signerUserAgent: userAgent,
        contentHash,
      });

      const consentRef = db.collection("consentRecords").doc();
      tx.create(consentRef, {
        ownerUid,
        patientId,
        kind,
        requestToken: token,
        signerName,
        signerCpf,
        guardianName: guardianName || null,
        contentHash,
        signedAt: new Date(now).toISOString(),
        signedAtMillis: now,
        ip,
        userAgent,
        templateVersion: typeof data.templateVersion === "string" ? data.templateVersion : "1",
        createdAt: new Date(now).toISOString(),
      });

      const patientRef = db.collection("patients").doc(patientId);
      if (kind === "tcle") {
        tx.update(patientRef, {
          tcleAceite: {
            acceptedAt: new Date(now).toISOString(),
            method: "digital",
            arquivo: null,
          },
        });
      } else if (kind === "contrato") {
        tx.update(patientRef, {
          contratoAssinado: {
            nome: `contrato-digital-${now}.pdf`,
            mime: "application/pdf",
            url: "",
            signedDigitally: true,
            contentHash,
            signedAt: new Date(now).toISOString(),
          },
        });
      }
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    if (reason === "missing") return invalid();
    if (reason === "signed") return NextResponse.json({ error: "Este link já foi usado." }, { status: 409 });
    if (reason === "expired") return NextResponse.json({ error: "Este link expirou." }, { status: 410 });
    console.error("sign:", error);
    return NextResponse.json({ error: "Não foi possível registrar." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
