import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { ensurePatientUserDoc } from "@/lib/server/patient-portal/account-utils";
import { acceptPortalInviteAndConnect } from "@/lib/server/patient-portal/connections";
import { isValidPublicToken } from "@/lib/server/public-token";
import { requireAuthUser } from "@/lib/server/require-auth";

export const runtime = "nodejs";

function inviteErrorResponse(code: string) {
  if (code === "convite_invalido") return NextResponse.json({ reason: code }, { status: 404 });
  if (code === "convite_expirado" || code === "convite_usado") {
    return NextResponse.json({ reason: code }, { status: 410 });
  }
  return NextResponse.json({ reason: code }, { status: 400 });
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!isValidPublicToken(token)) return NextResponse.json({ reason: "token_invalido" }, { status: 400 });

  const auth = await requireAuthUser(request);
  if (auth.error) return auth.error;

  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });

  const normalizedEmail = auth.email.trim().toLowerCase();
  if (!normalizedEmail) return NextResponse.json({ reason: "email_obrigatorio" }, { status: 400 });

  try {
    await ensurePatientUserDoc(db, auth.uid, normalizedEmail);
    await acceptPortalInviteAndConnect({
      db,
      inviteToken: token,
      patientUid: auth.uid,
      email: normalizedEmail,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "falha_vinculo";
    return inviteErrorResponse(code);
  }

  return NextResponse.json({ ok: true });
}
