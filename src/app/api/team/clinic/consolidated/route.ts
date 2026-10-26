import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { clinicAdminMemberUids } from "@/lib/server/team-access";
import { requireWorkspace } from "@/lib/server/require-workspace";

export async function GET(request: Request) {
  const ctx = await requireWorkspace(request);
  if ("error" in ctx) return ctx.error;
  if (ctx.workspace.clinicRole !== "admin" || !ctx.workspace.clinicId) {
    return NextResponse.json({ reason: "proibido" }, { status: 403 });
  }
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });

  const memberUids = await clinicAdminMemberUids(ctx.workspace.clinicId, ctx.auth.uid);
  if (!memberUids.length) return NextResponse.json({ agenda: [], financeiro: [] });

  const url = new URL(request.url);
  const windowStart = Number(url.searchParams.get("startMillis")) || Date.now() - 7 * 86400000;
  const windowEnd = Number(url.searchParams.get("endMillis")) || Date.now() + 30 * 86400000;

  const agenda: Record<string, unknown>[] = [];
  const financeiro: Record<string, unknown>[] = [];

  for (const ownerUid of memberUids) {
    const apptSnap = await db.collection("appointments").where("ownerUid", "==", ownerUid).get();
    for (const doc of apptSnap.docs) {
      const data = doc.data();
      const millis = Number(data.sessionStartMillis) || 0;
      if (millis < windowStart || millis > windowEnd) continue;
      agenda.push({
        id: doc.id,
        ownerUid,
        patientId: data.patientId,
        date: data.date,
        startTime: data.startTime,
        status: data.status,
        modality: data.modality,
        sessionStartMillis: millis,
      });
    }

    const paySnap = await db.collection("payments").where("ownerUid", "==", ownerUid).get();
    for (const doc of paySnap.docs) {
      const data = doc.data();
      financeiro.push({
        id: doc.id,
        ownerUid,
        patientId: data.patientId,
        descricao: data.descricao,
        dueDate: data.dueDate,
        dueDateMillis: data.dueDateMillis,
        valor: data.valor,
        status: data.status,
      });
    }
  }

  agenda.sort((a, b) => Number(a.sessionStartMillis) - Number(b.sessionStartMillis));
  financeiro.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));

  return NextResponse.json({ agenda, financeiro, memberUids });
}
