import { NextResponse } from "next/server";
import { mapAccount } from "@/lib/saas/account-store";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuthUser } from "@/lib/server/require-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ ok: false, message: "Serviço indisponível." }, { status: 503 });

  const ref = db.collection("users").doc(auth.uid);
  const snap = await ref.get();
  const account = mapAccount(auth.uid, snap.data());
  if (account.checkoutStatus !== "aguardando_confirmacao_pix") {
    return NextResponse.json({ ok: false, message: "Não há Pix aguardando confirmação." }, { status: 400 });
  }
  const nowIso = new Date().toISOString();
  await ref.collection("billingEvents").add({
    tipo: "pix_informado",
    resultado: "registrado",
    planId: account.checkoutPlanId,
    at: nowIso,
    summary: "Profissional informou que pagou o Pix. Aguardando validação na plataforma.",
  });
  return NextResponse.json({ ok: true });
}
