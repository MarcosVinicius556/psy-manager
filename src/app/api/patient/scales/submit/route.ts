import { NextResponse } from "next/server";
import { findScaleTemplate, isScaleTemplateId } from "@/lib/scales/catalog";
import { scoreGad7 } from "@/lib/scales/gad7";
import { scorePhq9 } from "@/lib/scales/phq9";
import { encryptFormResponses } from "@/lib/server/form-response-store";
import { requirePatientAuth } from "@/lib/server/patient-portal/auth";
import { sendPushToUser } from "@/lib/server/web-push";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requirePatientAuth(request);
  if ("error" in session) return session.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reason: "corpo_invalido" }, { status: 400 });
  }
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const templateId = typeof payload.templateId === "string" ? payload.templateId.trim() : "";
  const respostas =
    payload.respostas && typeof payload.respostas === "object" ? (payload.respostas as Record<string, string>) : {};
  if (!isScaleTemplateId(templateId)) return NextResponse.json({ reason: "escala_invalida" }, { status: 400 });

  const scored =
    templateId === "scale-phq9" ? scorePhq9(respostas) : templateId === "scale-gad7" ? scoreGad7(respostas) : null;
  if (!scored || !scored.ok) {
    return NextResponse.json({ reason: scored && !scored.ok ? scored.reason : "escala_invalida" }, { status: 400 });
  }

  const template = findScaleTemplate(templateId);
  if (!template) return NextResponse.json({ reason: "escala_ausente" }, { status: 404 });

  const now = new Date().toISOString();
  const encrypted = await encryptFormResponses(session.db, session.link.ownerUid, respostas);
  await session.db.collection("formResponses").add({
    ownerUid: session.link.ownerUid,
    patientId: session.link.patientId,
    templateId,
    templateVersion: template.versao,
    requestToken: "",
    respostas: encrypted.plain,
    enc: encrypted.enc,
    pontuacao: scored.pontuacao,
    faixa: scored.faixa,
    submittedAt: now,
    source: "patient_portal",
  });

  await sendPushToUser(session.db, session.link.ownerUid, {
    kind: "chamados",
    title: "Escala respondida",
    body: `${template.nome}: nova resposta no portal.`,
    url: `/admin/pacientes/${session.link.patientId}`,
  });

  return NextResponse.json({ ok: true, pontuacao: scored.pontuacao, faixa: scored.faixa });
}
