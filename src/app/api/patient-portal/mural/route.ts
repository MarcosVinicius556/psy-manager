import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { patientOwnedByUid } from "@/lib/server/clinic-access";
import { sendPatientPush } from "@/lib/server/patient-portal/push";
import { requireAuthUser } from "@/lib/server/require-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reason: "corpo_invalido" }, { status: 400 });
  }
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const patientId = typeof payload.patientId === "string" ? payload.patientId.trim() : "";
  const texto = typeof payload.texto === "string" ? payload.texto.trim() : "";
  if (!patientId || !texto) return NextResponse.json({ reason: "dados_invalidos" }, { status: 400 });
  if (!(await patientOwnedByUid(patientId, auth.uid))) {
    return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  }

  const patientSnap = await db.collection("patients").doc(patientId).get();
  const patientUid = typeof patientSnap.data()?.patientAuthUid === "string" ? patientSnap.data()!.patientAuthUid : "";

  const now = new Date().toISOString();
  const doc = await db.collection("patientMural").add({
    ownerUid: auth.uid,
    patientId,
    texto: texto.slice(0, 2000),
    fromPsychologist: true,
    createdAt: now,
    authorUid: auth.uid,
  });

  if (patientUid) {
    await sendPatientPush(db, patientUid, {
      kind: "diario",
      title: "Mensagem do seu psicólogo(a)",
      body: "Há uma mensagem nova no mural.",
      url: "/paciente/mural",
    });
  }

  return NextResponse.json({ id: doc.id });
}
