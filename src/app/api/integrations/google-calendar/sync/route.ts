import { NextResponse } from "next/server";
import { requireGoogleUser } from "@/lib/google-calendar/api-auth";
import { syncAppointmentForUser } from "@/lib/google-calendar/sync-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireGoogleUser(request);
  if ("error" in auth) return auth.error;
  const body = (await request.json()) as { appointmentId?: string; action?: "upsert" | "delete" };
  const appointmentId = typeof body.appointmentId === "string" ? body.appointmentId.trim() : "";
  const action = body.action === "delete" ? "delete" : "upsert";
  if (!appointmentId) {
    return NextResponse.json({ ok: false, reason: "atendimento_invalido" }, { status: 400 });
  }
  try {
    const result = await syncAppointmentForUser(auth.uid, appointmentId, action);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, reason: "sync_falhou" }, { status: 502 });
  }
}
