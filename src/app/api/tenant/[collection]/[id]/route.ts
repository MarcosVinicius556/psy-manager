import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireWorkspace } from "@/lib/server/require-workspace";
import {
  secretaryUpsertAppointment,
  secretaryUpsertPatient,
  secretaryUpsertPayment,
} from "@/lib/server/tenant-secretary";

const ALLOWED = new Set(["patients", "appointments", "payments"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ collection: string; id: string }> }
) {
  const ctx = await requireWorkspace(request);
  if ("error" in ctx) return ctx.error;
  const { collection, id } = await context.params;
  if (!ALLOWED.has(collection)) return NextResponse.json({ reason: "colecao_invalida" }, { status: 400 });

  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ reason: "corpo_invalido" }, { status: 400 });
  }

  let result;
  if (collection === "patients") result = await secretaryUpsertPatient(db, ctx.workspace, id, body);
  else if (collection === "appointments") result = await secretaryUpsertAppointment(db, ctx.workspace, id, body);
  else result = await secretaryUpsertPayment(db, ctx.workspace, id, body);

  if ("error" in result) {
    const status = result.error === "proibido" ? 403 : result.error === "nao_encontrado" ? 404 : 503;
    return NextResponse.json({ reason: result.error }, { status });
  }
  return NextResponse.json({ id: result.id });
}
