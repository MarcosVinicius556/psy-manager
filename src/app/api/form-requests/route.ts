import { NextResponse } from "next/server";
import { findBuiltinFormTemplate } from "@/lib/admin/form-templates-builtin";
import { getAdminDb } from "@/lib/firebase-admin";
import { patientOwnedByUid } from "@/lib/server/clinic-access";
import { FORM_TTL_MS } from "@/lib/server/form-public";
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
  const templateId = typeof payload.templateId === "string" ? payload.templateId.trim() : "";

  if (!patientId || !templateId) {
    return NextResponse.json({ reason: "dados_invalidos" }, { status: 400 });
  }
  if (!(await patientOwnedByUid(patientId, auth.uid))) {
    return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  }

  const patientSnap = await db.collection("patients").doc(patientId).get();
  if (!patientSnap.exists) return NextResponse.json({ reason: "paciente_ausente" }, { status: 404 });
  const patientNome = typeof patientSnap.data()?.nome === "string" ? patientSnap.data()!.nome : "";

  let templateNome = "";
  let templateVersion = 1;
  let finalidade = "";
  let campos: unknown[] = [];

  const builtin = findBuiltinFormTemplate(templateId);
  if (builtin) {
    templateNome = builtin.nome;
    templateVersion = builtin.versao;
    finalidade = builtin.finalidade;
    campos = builtin.campos;
  } else {
    const customSnap = await db.collection("formTemplates").doc(templateId).get();
    if (!customSnap.exists || customSnap.data()?.ownerUid !== auth.uid) {
      return NextResponse.json({ reason: "modelo_ausente" }, { status: 404 });
    }
    const data = customSnap.data()!;
    templateNome = typeof data.nome === "string" ? data.nome : "Formulário";
    templateVersion = Number(data.versao) || 1;
    finalidade = typeof data.finalidade === "string" ? data.finalidade : "";
    campos = Array.isArray(data.campos) ? data.campos : [];
  }

  const token = crypto.randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + FORM_TTL_MS);
  const createdAt = now.toISOString();
  const expiresAt = expires.toISOString();

  await db.collection("formRequests").doc(token).set({
    ownerUid: auth.uid,
    patientId,
    patientNome,
    templateId,
    templateNome,
    templateVersion,
    finalidade,
    campos,
    expiresAt,
    expiresAtMillis: expires.getTime(),
    answeredAt: null,
    answeredAtMillis: null,
    createdAt,
  });

  return NextResponse.json({
    token,
    expiresAt,
    link: `/formulario/${token}`,
  });
}
