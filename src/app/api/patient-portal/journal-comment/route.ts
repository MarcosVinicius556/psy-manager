import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendPatientPush } from "@/lib/server/patient-portal/push";
import { requirePsychologistPortalClinicalActor } from "@/lib/server/patient-portal/psychologist-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const gate = await requirePsychologistPortalClinicalActor(request);
  if ("error" in gate) return gate.error;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reason: "corpo_invalido" }, { status: 400 });
  }
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const entryId = typeof payload.entryId === "string" ? payload.entryId.trim() : "";
  const texto = typeof payload.texto === "string" ? payload.texto.trim() : "";
  if (!entryId || !texto) return NextResponse.json({ reason: "dados_invalidos" }, { status: 400 });

  const entryRef = db.collection("patientJournal").doc(entryId);
  const entrySnap = await entryRef.get();
  if (!entrySnap.exists) return NextResponse.json({ reason: "nao_encontrado" }, { status: 404 });
  const entry = entrySnap.data() || {};
  if (entry.ownerUid !== gate.ownerUid) return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  if (entry.compartilhado !== true) return NextResponse.json({ reason: "nao_compartilhado" }, { status: 400 });

  const now = new Date().toISOString();
  const comment = {
    id: crypto.randomUUID(),
    texto: texto.slice(0, 1000),
    createdAt: now,
    authorUid: gate.ownerUid,
  };
  await entryRef.update({ comentarios: FieldValue.arrayUnion(comment), updatedAt: now });

  const patientUid = typeof entry.patientUid === "string" ? entry.patientUid : "";
  if (patientUid) {
    await sendPatientPush(db, patientUid, {
      kind: "diario",
      title: "Comentário no diário",
      body: "Seu psicólogo(a) comentou um registro compartilhado.",
      url: "/paciente/diario",
    });
  }

  return NextResponse.json({ ok: true });
}
