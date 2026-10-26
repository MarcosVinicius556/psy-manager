import { NextResponse } from "next/server";
import { extendPaidUntilMillis, subscriptionPlanAmountCents } from "@/lib/billing/subscription-pix";
import { mapAccount } from "@/lib/saas/account-store";
import { requireSuperAdmin } from "@/lib/server/require-super-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireSuperAdmin(request);
  if ("error" in auth) return auth.error;
  const { db } = auth;
  const body = (await request.json().catch(() => ({}))) as { targetUid?: string };
  const targetUid = typeof body.targetUid === "string" ? body.targetUid.trim() : "";
  if (!targetUid) return NextResponse.json({ ok: false, message: "Conta inválida." }, { status: 400 });

  const ref = db.collection("users").doc(targetUid);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ ok: false, message: "Conta não encontrada." }, { status: 404 });
  const account = mapAccount(targetUid, snap.data());
  if (account.role === "super_admin") {
    return NextResponse.json({ ok: false, message: "Conta do proprietário fora deste fluxo." }, { status: 400 });
  }
  const planId = account.checkoutPlanId || account.planId;
  if (!planId || planId === "avaliacao" || planId === "legado") {
    return NextResponse.json({ ok: false, message: "Plano inválido para confirmação." }, { status: 400 });
  }
  const amount = subscriptionPlanAmountCents(planId);
  if (amount == null) return NextResponse.json({ ok: false, message: "Plano sem preço." }, { status: 400 });

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const paidUntilMillis = extendPaidUntilMillis(planId, account.paidUntilMillis, now);

  await ref.set(
    {
      subscriptionStatus: "ativa",
      billingAccess: "integral",
      accountStatus: "ativa",
      planId,
      paidUntilMillis,
      checkoutStatus: "",
      checkoutPlanId: "",
      checkoutRequestedAt: "",
      cancelAtPeriodEnd: false,
      accessUntilMillis: 0,
      updatedAt: nowIso,
    },
    { merge: true }
  );

  await ref.collection("billingEvents").add({
    tipo: "pix_confirmado",
    resultado: "pago",
    planId,
    at: nowIso,
    summary: `Pagamento Pix confirmado. Acesso integral até ${new Date(paidUntilMillis).toLocaleString("pt-BR")}.`,
  });

  await db.collection("platformAudit").add({
    actorUid: auth.uid,
    actorEmail: auth.email || "",
    action: "confirmar_pix_assinatura",
    targetUid,
    targetEmail: account.email,
    at: nowIso,
    result: "ok",
    summary: `Pix da assinatura confirmado (${planId}). Pago até ${new Date(paidUntilMillis).toLocaleString("pt-BR")}.`,
  });

  return NextResponse.json({ ok: true, paidUntilMillis, planId });
}
