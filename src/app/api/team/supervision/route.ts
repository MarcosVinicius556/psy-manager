import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { buildAnonymizedCase } from "@/lib/team/anonymize-case";
import { createSupervisionShare } from "@/lib/server/supervision-service";
import { requireWorkspace } from "@/lib/server/require-workspace";

export async function POST(request: Request) {
  const ctx = await requireWorkspace(request);
  if ("error" in ctx) return ctx.error;
  if (!ctx.workspace.isClinicalAllowed || ctx.workspace.kind === "secretaria") {
    return NextResponse.json({ reason: "proibido" }, { status: 403 });
  }
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });

  const body = await request.json();
  const patientId = typeof body.patientId === "string" ? body.patientId.trim() : "";
  const titulo = typeof body.titulo === "string" ? body.titulo : "";
  const confirmed = body.reviewerConfirmed === true;
  if (!patientId || !confirmed) {
    return NextResponse.json({ error: "Confirme a revisão antes de compartilhar." }, { status: 400 });
  }

  const ownerUid = ctx.workspace.tenantOwnerUid;
  const patientSnap = await db.collection("patients").doc(patientId).get();
  if (!patientSnap.exists || patientSnap.data()?.ownerUid !== ownerUid) {
    return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
  }
  const patientData = patientSnap.data() || {};

  const apptSnap = await db.collection("appointments").where("ownerUid", "==", ownerUid).where("patientId", "==", patientId).get();
  const sessions: { date: string; clinical: import("@/lib/admin/types").ClinicalRecord }[] = [];
  for (const doc of apptSnap.docs) {
    const recordSnap = await db.collection("clinicalRecords").doc(doc.id).get();
    if (!recordSnap.exists) continue;
    const clinical = (recordSnap.data()?.clinical || {}) as import("@/lib/admin/types").ClinicalRecord;
    sessions.push({ date: String(doc.data().date || ""), clinical });
  }

  const payload = buildAnonymizedCase({
    patient: {
      id: patientId,
      nome: String(patientData.nome || ""),
      cpf: String(patientData.cpf || ""),
      cpfPagador: String(patientData.cpfPagador || ""),
      cpfBeneficiario: String(patientData.cpfBeneficiario || ""),
      nascimento: String(patientData.nascimento || ""),
      telefone: String(patientData.telefone || ""),
      email: String(patientData.email || ""),
      endereco: String(patientData.endereco || ""),
      contatoEmergencia: "",
      observacoes: "",
      foto: "",
      contratoAssinado: null,
      tcleAceite: null,
      status: patientData.status === "inativo" ? "inativo" : "ativo",
      createdAt: String(patientData.createdAt || ""),
    },
    sessions,
    titulo,
  });

  const share = await createSupervisionShare({
    ownerUid,
    patientId,
    createdByUid: ctx.auth.uid,
    payload,
  });
  if (!share) return NextResponse.json({ error: "Não foi possível criar o link." }, { status: 500 });

  const link = `${new URL(request.url).origin}/supervisao/${share.token}`;
  return NextResponse.json({ link, token: share.token, expiresAtMillis: share.expiresAtMillis, payload });
}
