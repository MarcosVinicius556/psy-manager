import { NextResponse } from "next/server";
import { confirmPatientAppointment, listPatientAppointments } from "@/lib/server/patient-portal/data";
import { requirePatientAuth } from "@/lib/server/patient-portal/auth";
import { sendPushToUser } from "@/lib/server/web-push";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requirePatientAuth(request);
  if ("error" in session) return session.error;
  const items = await listPatientAppointments(session.db, session.link);
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
  const appointmentId = typeof payload.appointmentId === "string" ? payload.appointmentId.trim() : "";
  const action = payload.action === "remarcar" ? "remarcar" : payload.action === "confirmar" ? "confirmada" : "";
  if (!appointmentId || !action) return NextResponse.json({ reason: "dados_invalidos" }, { status: 400 });

  const result = await confirmPatientAppointment(session.db, session.link, appointmentId, action);
  if (!result.ok) return NextResponse.json({ reason: result.reason }, { status: 400 });

  const title = action === "confirmada" ? "Sessão confirmada" : "Pedido de remarcação";
  await sendPushToUser(
    session.db,
    session.link.ownerUid,
    {
      kind: "confirmacoes",
      title,
      body: "Atualização enviada pelo portal do paciente.",
      url: `/admin/atendimentos/${appointmentId}`,
    }
  );

  return NextResponse.json({ ok: true });
}
