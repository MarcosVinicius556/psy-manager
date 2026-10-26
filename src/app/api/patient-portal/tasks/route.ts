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
  const titulo = typeof payload.titulo === "string" ? payload.titulo.trim() : "";
  const prazo = typeof payload.prazo === "string" ? payload.prazo.trim() : "";
  if (!patientId || !titulo) return NextResponse.json({ reason: "dados_invalidos" }, { status: 400 });
  if (!(await patientOwnedByUid(patientId, auth.uid))) {
    return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  }

  const patientSnap = await db.collection("patients").doc(patientId).get();
  const patientUid = typeof patientSnap.data()?.patientAuthUid === "string" ? patientSnap.data()!.patientAuthUid : "";

  const now = new Date().toISOString();
  const doc = await db.collection("patientTasks").add({
    ownerUid: auth.uid,
    patientId,
    titulo: titulo.slice(0, 200),
    prazo: prazo || null,
    concluidaEm: null,
    createdAt: now,
    createdBy: auth.uid,
  });

  if (patientUid) {
    await sendPatientPush(db, patientUid, {
      kind: "diario",
      title: "Nova tarefa",
      body: "Você tem uma atividade nova no portal.",
      url: "/paciente/tarefas",
    });
  }

  return NextResponse.json({ id: doc.id });
}
