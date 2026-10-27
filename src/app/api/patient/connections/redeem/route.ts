import { NextResponse } from "next/server";
import { requirePatientSession } from "@/lib/server/patient-portal/auth";
import { appendLinkCodeAudit, loadLinkCodeByInput } from "@/lib/server/patient-portal/link-codes";
import { linkPatientConnection } from "@/lib/server/patient-portal/connections";
import { enforceLinkCodeRedeemRateLimit } from "@/lib/server/patient-portal/redeem-rate-limit";
import { ensurePatientUserDoc } from "@/lib/server/patient-portal/account-utils";

export const runtime = "nodejs";

const GENERIC_ERROR = { reason: "codigo_invalido" };

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  const session = await requirePatientSession(request);
  if ("error" in session) return session.error;

  const ip = clientIp(request);
  const limited = await enforceLinkCodeRedeemRateLimit(ip, session.uid);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(GENERIC_ERROR, { status: 400 });
  }
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const code = typeof payload.code === "string" ? payload.code.trim() : "";
  if (!code) return NextResponse.json(GENERIC_ERROR, { status: 400 });

  const loaded = await loadLinkCodeByInput(session.db, code);
  if (!loaded) {
    await appendLinkCodeAudit(session.db, { action: "redeem", patientUid: session.uid, ip, success: false });
    return NextResponse.json(GENERIC_ERROR, { status: 400 });
  }

  const doc = loaded.data;
  if (doc.status !== "pendente" || doc.expiresAtMillis <= Date.now()) {
    await appendLinkCodeAudit(session.db, {
      action: "redeem",
      patientUid: session.uid,
      ownerUid: doc.ownerUid,
      patientId: doc.patientId,
      ip,
      success: false,
    });
    return NextResponse.json(GENERIC_ERROR, { status: 400 });
  }

  try {
    await ensurePatientUserDoc(session.db, session.uid, session.email);
    await linkPatientConnection({
      db: session.db,
      patientUid: session.uid,
      email: session.email,
      ownerUid: doc.ownerUid,
      patientId: doc.patientId,
      skipEmailCheck: true,
      makeActive: true,
    });
  } catch {
    await appendLinkCodeAudit(session.db, {
      action: "redeem",
      patientUid: session.uid,
      ownerUid: doc.ownerUid,
      patientId: doc.patientId,
      ip,
      success: false,
    });
    return NextResponse.json(GENERIC_ERROR, { status: 400 });
  }

  const now = new Date().toISOString();
  await loaded.ref.set({ status: "vinculado", usedAt: now, usedByUid: session.uid }, { merge: true });
  await appendLinkCodeAudit(session.db, {
    action: "redeem",
    patientUid: session.uid,
    ownerUid: doc.ownerUid,
    patientId: doc.patientId,
    ip,
    success: true,
  });

  return NextResponse.json({ ok: true });
}
