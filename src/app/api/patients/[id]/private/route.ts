import { NextResponse } from "next/server";
import { pickPatientPrivateFields } from "@/lib/admin/patient-private";
import { getAdminDb } from "@/lib/firebase-admin";
import { readPatientPrivateForOwner, writePatientPrivateForOwner } from "@/lib/server/patient-private-service";
import { requireWorkspace } from "@/lib/server/require-workspace";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = await requireWorkspace(request);
  if ("error" in ctx) return ctx.error;
  if (ctx.workspace.kind === "secretaria") {
    return NextResponse.json({ reason: "proibido" }, { status: 403 });
  }
  if (ctx.workspace.actorUid !== ctx.workspace.tenantOwnerUid) {
    return NextResponse.json({ reason: "proibido" }, { status: 403 });
  }

  const { id: patientId } = await context.params;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });

  const fields = await readPatientPrivateForOwner(db, ctx.workspace.tenantOwnerUid, patientId);
  if (!fields) return NextResponse.json({ reason: "nao_encontrado" }, { status: 404 });
  return NextResponse.json({ fields });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = await requireWorkspace(request);
  if ("error" in ctx) return ctx.error;
  if (ctx.workspace.kind === "secretaria") {
    return NextResponse.json({ reason: "proibido" }, { status: 403 });
  }
  if (ctx.workspace.actorUid !== ctx.workspace.tenantOwnerUid) {
    return NextResponse.json({ reason: "proibido" }, { status: 403 });
  }

  const { id: patientId } = await context.params;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reason: "corpo_invalido" }, { status: 400 });
  }
  const fields = pickPatientPrivateFields((body || {}) as Record<string, unknown>);

  const result = await writePatientPrivateForOwner(db, ctx.workspace.tenantOwnerUid, patientId, fields);
  if (!result.ok) {
    const status = result.reason === "sem_permissao" ? 403 : 404;
    return NextResponse.json({ reason: result.reason }, { status });
  }
  return NextResponse.json({ success: true });
}
