import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifyReminderUnsubscribeToken } from "@/lib/server/session-confirmation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ownerUid = url.searchParams.get("ownerUid")?.trim() || "";
  const patientId = url.searchParams.get("patientId")?.trim() || "";
  const token = url.searchParams.get("token")?.trim() || "";

  if (!ownerUid || !patientId || !token || !verifyReminderUnsubscribeToken(ownerUid, patientId, token)) {
    return new NextResponse(
      `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/><title>Link inválido</title></head><body style="font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto"><h1>Link inválido</h1><p>Não foi possível validar o pedido de descadastro.</p></body></html>`,
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const db = getAdminDb();
  if (db) {
    const patientRef = db.collection("patients").doc(patientId);
    const snap = await patientRef.get();
    if (snap.exists && snap.data()?.ownerUid === ownerUid) {
      await patientRef.set({ lembretesEmail: false, updatedAt: new Date().toISOString() }, { merge: true });
    }
  }

  return new NextResponse(
    `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/><title>Lembretes desativados</title></head><body style="font-family:system-ui,sans-serif;padding:2rem;max-width:32rem;margin:auto"><h1>Lembretes desativados</h1><p>Você não receberá mais lembretes automáticos de sessão por e-mail deste consultório.</p><p style="color:#5a6b5c;font-size:0.95rem">Para voltar a receber, peça ao profissional para reativar na ficha do paciente.</p></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
