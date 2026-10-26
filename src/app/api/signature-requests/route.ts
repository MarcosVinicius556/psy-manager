import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { patientOwnedByUid } from "@/lib/server/clinic-access";
import { buildSignatureDocument } from "@/lib/server/signature-document";
import { SIGNATURE_TTL_MS, type SignatureDocKind } from "@/lib/server/signature-requests";
import { requireAuthUser } from "@/lib/server/require-auth";
import type { ClinicMember, Modality, Patient } from "@/lib/admin/types";

export const runtime = "nodejs";

const KINDS: SignatureDocKind[] = ["tcle", "contrato", "consentimento_gravacao", "consentimento_imagem"];

function mapPatient(data: FirebaseFirestore.DocumentData, id: string): Patient {
  return { id, ...(data as Omit<Patient, "id">) };
}

function mapMember(data: FirebaseFirestore.DocumentData, id: string): ClinicMember {
  return { id, ...(data as Omit<ClinicMember, "id">) };
}

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
  const kind = typeof payload.kind === "string" ? payload.kind : "";
  const contractTemplateId = typeof payload.contractTemplateId === "string" ? payload.contractTemplateId.trim() : "";
  const modality = (typeof payload.modality === "string" ? payload.modality : "presencial") as Modality;

  if (!patientId || !KINDS.includes(kind as SignatureDocKind)) {
    return NextResponse.json({ reason: "dados_invalidos" }, { status: 400 });
  }
  if (!(await patientOwnedByUid(patientId, auth.uid))) {
    return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  }

  const patientSnap = await db.collection("patients").doc(patientId).get();
  if (!patientSnap.exists) return NextResponse.json({ reason: "paciente_ausente" }, { status: 404 });
  const patient = mapPatient(patientSnap.data()!, patientId);

  const members = await db.collection("members").where("ownerUid", "==", auth.uid).limit(5).get();
  const professional =
    members.docs
      .map((doc) => mapMember(doc.data(), doc.id))
      .find((item) => item.uid === auth.uid || item.email === auth.email?.toLowerCase()) ?? null;

  let contractMarkdown = "";
  if (kind === "contrato" && contractTemplateId) {
    const templateSnap = await db.collection("contractTemplates").doc(contractTemplateId).get();
    if (!templateSnap.exists || templateSnap.data()?.ownerUid !== auth.uid) {
      return NextResponse.json({ reason: "modelo_ausente" }, { status: 404 });
    }
    contractMarkdown = typeof templateSnap.data()?.conteudo === "string" ? templateSnap.data()!.conteudo : "";
  }

  const { body: docBody, templateVersion } = buildSignatureDocument({
    kind: kind as SignatureDocKind,
    patient,
    professional,
    contractMarkdown,
    modality,
  });

  const token = crypto.randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + SIGNATURE_TTL_MS);
  const createdAt = now.toISOString();
  const expiresAt = expires.toISOString();

  await db.collection("signatureRequests").doc(token).set({
    ownerUid: auth.uid,
    patientId,
    patientNome: patient.nome,
    kind,
    body: docBody,
    templateVersion,
    contractTemplateId: contractTemplateId || null,
    modality,
    expiresAt,
    expiresAtMillis: expires.getTime(),
    signedAt: null,
    signedAtMillis: null,
    createdAt,
  });

  return NextResponse.json({
    token,
    expiresAt,
    link: `/assinar/${token}`,
  });
}
