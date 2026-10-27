import { NextResponse } from "next/server";
import { requirePatientSession } from "@/lib/server/patient-portal/auth";
import {
  activatePatientConnection,
  deactivatePatientConnection,
  disconnectPatientConnection,
} from "@/lib/server/patient-portal/connections";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requirePatientSession(request);
  if ("error" in session) return session.error;

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reason: "corpo_invalido" }, { status: 400 });
  }
  const action = body && typeof body === "object" ? (body as Record<string, unknown>).action : "";
  if (action === "ativar") {
    try {
      await activatePatientConnection(session.db, session.uid, id);
      return NextResponse.json({ ok: true });
    } catch (error) {
      const code = error instanceof Error ? error.message : "falha";
      return NextResponse.json({ reason: code }, { status: 400 });
    }
  }
  if (action === "desativar") {
    try {
      await deactivatePatientConnection(session.db, session.uid, id);
      return NextResponse.json({ ok: true });
    } catch (error) {
      const code = error instanceof Error ? error.message : "falha";
      return NextResponse.json({ reason: code }, { status: 400 });
    }
  }
  return NextResponse.json({ reason: "acao_invalida" }, { status: 400 });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requirePatientSession(request);
  if ("error" in session) return session.error;
  const { id } = await context.params;
  try {
    await disconnectPatientConnection(session.db, session.uid, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "falha";
    return NextResponse.json({ reason: code }, { status: 400 });
  }
}
