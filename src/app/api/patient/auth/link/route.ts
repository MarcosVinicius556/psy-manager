import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { linkPatientAccount, loadPatientAccountLink } from "@/lib/server/patient-portal/auth";
import { ensurePatientAccountShell } from "@/lib/server/patient-portal/connections";
import { requireAuthUser } from "@/lib/server/require-auth";

export const runtime = "nodejs";

/** Vincula conta Firebase (e-mail verificado) a um paciente com portal ativo e e-mail correspondente. */
export async function POST(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;

  if (!auth.emailTrustedForLinking) {
    return NextResponse.json({ reason: "email_nao_verificado" }, { status: 403 });
  }

  const existing = await loadPatientAccountLink(auth.uid);
  if (existing?.ownerUid && existing.patientId) {
    return NextResponse.json({ ok: true, linked: true });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });
  const email = auth.email.trim().toLowerCase();
  if (!email) return NextResponse.json({ reason: "email_obrigatorio" }, { status: 400 });

  await ensurePatientAccountShell(db, auth.uid, email);

  const patientsSnap = await db.collection("patients").where("email", "==", email).limit(20).get();
  const match = patientsSnap.docs.find((doc) => doc.data().portalAtivo === true);
  if (!match) return NextResponse.json({ reason: "nenhum_portal_para_email" }, { status: 404 });

  const ownerUid = typeof match.data().ownerUid === "string" ? match.data().ownerUid : "";
  if (!ownerUid) return NextResponse.json({ reason: "paciente_invalido" }, { status: 400 });

  try {
    await linkPatientAccount({
      db,
      uid: auth.uid,
      email,
      ownerUid,
      patientId: match.id,
      emailTrustedForLinking: true,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "falha_vinculo";
    return NextResponse.json({ reason: code }, { status: 400 });
  }

  return NextResponse.json({ ok: true, linked: true });
}
