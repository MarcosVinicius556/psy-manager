import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { ensurePatientAccountShell } from "@/lib/server/patient-portal/connections";
import { ensurePatientUserDoc, setPatientCustomClaims } from "@/lib/server/patient-portal/account-utils";
import { requireAuthUser } from "@/lib/server/require-auth";

export const runtime = "nodejs";

/** Registra conta de portal (após signup Firebase). Nunca promove a psicólogo. */
export async function POST(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;

  const email = auth.email?.trim().toLowerCase() || "";
  if (!email) return NextResponse.json({ reason: "email_obrigatorio" }, { status: 400 });

  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });

  try {
    await ensurePatientUserDoc(db, auth.uid, email);
  } catch (error) {
    const code = error instanceof Error ? error.message : "falha_registro";
    return NextResponse.json({ reason: code }, { status: 403 });
  }

  const shell = await ensurePatientAccountShell(db, auth.uid, email);
  await setPatientCustomClaims(auth.uid, "", "");

  return NextResponse.json({ ok: true, profileComplete: shell.profileComplete });
}
