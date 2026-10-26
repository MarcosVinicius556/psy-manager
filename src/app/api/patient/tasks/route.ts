import { NextResponse } from "next/server";
import { completeHomeworkTask, listHomeworkTasks } from "@/lib/server/patient-portal/data";
import { requirePatientAuth } from "@/lib/server/patient-portal/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requirePatientAuth(request);
  if ("error" in session) return session.error;
  const items = await listHomeworkTasks(session.db, session.link);
  return NextResponse.json({ items });
}

export async function PATCH(request: Request) {
  const session = await requirePatientAuth(request);
  if ("error" in session) return session.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reason: "corpo_invalido" }, { status: 400 });
  }
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const taskId = typeof payload.taskId === "string" ? payload.taskId.trim() : "";
  if (!taskId) return NextResponse.json({ reason: "taskId_obrigatorio" }, { status: 400 });
  const ok = await completeHomeworkTask(session.db, session.link, taskId);
  if (!ok) return NextResponse.json({ reason: "nao_encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
