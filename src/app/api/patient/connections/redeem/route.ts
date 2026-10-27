import { NextResponse } from "next/server";
import { requirePatientSession } from "@/lib/server/patient-portal/auth";
import { appendLinkCodeAudit } from "@/lib/server/patient-portal/link-codes";
import { redeemPatientLinkCodeAndConnect } from "@/lib/server/patient-portal/connections";
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

  try {
    await ensurePatientUserDoc(session.db, session.uid, session.email);
    const result = await redeemPatientLinkCodeAndConnect({
      db: session.db,
      codeInput: code,
      patientUid: session.uid,
      email: session.email,
    });
    await appendLinkCodeAudit(session.db, {
      action: "redeem",
      patientUid: session.uid,
      ownerUid: result.ownerUid,
      patientId: result.patientId,
      ip,
      success: true,
    });
    return NextResponse.json({ ok: true });
  } catch {
    await appendLinkCodeAudit(session.db, { action: "redeem", patientUid: session.uid, ip, success: false });
    return NextResponse.json(GENERIC_ERROR, { status: 400 });
  }
}
