import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { LEGAL_DOCUMENTS, type LegalAcceptanceDocument } from "@/lib/legal/config";
import { hashLegalContent } from "@/lib/legal/hash";
import { getAdminDb } from "@/lib/firebase-admin";
import { bearerToken, verifyFirebaseIdToken } from "@/lib/server/verify-id-token";

const ALLOWED: LegalAcceptanceDocument[] = ["termos", "privacidade", "dpa"];

export async function POST(request: Request) {
  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ message: "Serviço indisponível." }, { status: 503 });
  }
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  const identity = await verifyFirebaseIdToken(token);
  if (!identity) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });

  let body: { documents?: string[] };
  try {
    body = (await request.json()) as { documents?: string[] };
  } catch {
    return NextResponse.json({ message: "Corpo inválido." }, { status: 400 });
  }

  const documents = (body.documents || []).filter((item): item is LegalAcceptanceDocument =>
    ALLOWED.includes(item as LegalAcceptanceDocument),
  );
  if (!documents.length) {
    return NextResponse.json({ message: "Informe ao menos um documento." }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "";
  const userAgent = request.headers.get("user-agent")?.slice(0, 512) || "";
  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  for (const document of documents) {
    const meta = LEGAL_DOCUMENTS[document];
    const ref = db.collection("legalAcceptances").doc();
    batch.set(ref, {
      uid: identity.uid,
      document,
      version: meta.version,
      contentHash: hashLegalContent(meta.acceptanceSource),
      acceptedAt: now,
      ip,
      userAgent,
    });
  }

  const userRef = db.collection("users").doc(identity.uid);
  const userPatch: Record<string, string> = {};
  if (documents.includes("termos")) {
    userPatch.termsAcceptedAt = new Date().toISOString();
    userPatch.termsVersion = LEGAL_DOCUMENTS.termos.version;
  }
  if (documents.includes("privacidade")) {
    userPatch.privacyAcknowledgedAt = new Date().toISOString();
  }
  if (Object.keys(userPatch).length) {
    batch.set(userRef, userPatch, { merge: true });
  }

  await batch.commit();
  return NextResponse.json({ ok: true });
}
