import { NextResponse } from "next/server";
import { requirePatientSession } from "@/lib/server/patient-portal/auth";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const session = await requirePatientSession(request);
  if ("error" in session) return session.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reason: "corpo_invalido" }, { status: 400 });
  }
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const nome = typeof payload.nome === "string" ? payload.nome.trim() : "";
  const telefone = typeof payload.telefone === "string" ? payload.telefone.replace(/\D/g, "") : "";
  const telefonePais = typeof payload.telefonePais === "string" ? payload.telefonePais.trim() : "+55";

  if (nome.length < 2) return NextResponse.json({ reason: "nome_obrigatorio" }, { status: 400 });
  if (telefone.length < 8) return NextResponse.json({ reason: "telefone_obrigatorio" }, { status: 400 });

  const now = new Date().toISOString();
  await session.db.collection("patientAccounts").doc(session.uid).set(
    {
      nome,
      telefone,
      telefonePais,
      profileComplete: true,
      updatedAt: now,
    },
    { merge: true }
  );

  await session.db.collection("users").doc(session.uid).set({ nome, updatedAt: now }, { merge: true });

  return NextResponse.json({ ok: true, profileComplete: true });
}
