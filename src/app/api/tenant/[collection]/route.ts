import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireWorkspace } from "@/lib/server/require-workspace";
import {
  secretaryListAppointments,
  secretaryListMembers,
  secretaryListNotifications,
  secretaryListPackages,
  secretaryListPatients,
  secretaryListPayments,
  secretaryUpsertAppointment,
  secretaryUpsertPatient,
  secretaryUpsertPayment,
} from "@/lib/server/tenant-secretary";

const ALLOWED = new Set(["patients", "appointments", "payments", "members", "notifications", "packages"]);

export async function GET(request: Request, context: { params: Promise<{ collection: string }> }) {
  const ctx = await requireWorkspace(request);
  if ("error" in ctx) return ctx.error;
  const { collection } = await context.params;
  if (!ALLOWED.has(collection)) return NextResponse.json({ reason: "colecao_invalida" }, { status: 400 });

  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });

  const url = new URL(request.url);
  const startMillis = Number(url.searchParams.get("startMillis"));
  const endMillis = Number(url.searchParams.get("endMillis"));

  let result;
  if (collection === "patients") result = await secretaryListPatients(db, ctx.workspace);
  else if (collection === "payments") {
    result = await secretaryListPayments(
      db,
      ctx.workspace,
      Number.isFinite(startMillis) ? startMillis : undefined,
      Number.isFinite(endMillis) ? endMillis : undefined
    );
  } else if (collection === "appointments") {
    if (!Number.isFinite(startMillis) || !Number.isFinite(endMillis)) {
      return NextResponse.json({ reason: "janela_obrigatoria" }, { status: 400 });
    }
    result = await secretaryListAppointments(db, ctx.workspace, startMillis, endMillis);
  } else if (collection === "members") result = await secretaryListMembers(db, ctx.workspace);
  else if (collection === "notifications") result = await secretaryListNotifications(db, ctx.workspace);
  else result = await secretaryListPackages(db, ctx.workspace);

  if ("error" in result) {
    const status = result.error === "proibido" ? 403 : 503;
    return NextResponse.json({ reason: result.error }, { status });
  }
  return NextResponse.json({ docs: result.docs });
}

export async function POST(request: Request, context: { params: Promise<{ collection: string }> }) {
  const ctx = await requireWorkspace(request);
  if ("error" in ctx) return ctx.error;
  const { collection } = await context.params;
  if (!ALLOWED.has(collection) || collection === "members" || collection === "notifications") {
    return NextResponse.json({ reason: "colecao_invalida" }, { status: 400 });
  }
  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ reason: "corpo_invalido" }, { status: 400 });
  }

  let result;
  if (collection === "patients") result = await secretaryUpsertPatient(db, ctx.workspace, null, body);
  else if (collection === "appointments") result = await secretaryUpsertAppointment(db, ctx.workspace, null, body);
  else result = await secretaryUpsertPayment(db, ctx.workspace, null, body);

  if ("error" in result) {
    const status = result.error === "proibido" ? 403 : result.error === "nao_encontrado" ? 404 : 503;
    return NextResponse.json({ reason: result.error }, { status });
  }
  return NextResponse.json({ id: result.id });
}
