import { NextResponse } from "next/server";
import { buildPlatformSubscriptionPixBrcode } from "@/lib/billing/platform-pix";
import { subscriptionPlanAmountCents, subscriptionPixTxid } from "@/lib/billing/subscription-pix";
import { mapAccount } from "@/lib/saas/account-store";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuthUser } from "@/lib/server/require-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ ok: false, reason: "admin_indisponivel" }, { status: 503 });

  const url = new URL(request.url);
  const planId = url.searchParams.get("planId")?.trim() || "";
  const snap = await db.collection("users").doc(auth.uid).get();
  const account = mapAccount(auth.uid, snap.data());
  const effectivePlan = planId || account.checkoutPlanId;
  const amountCents = subscriptionPlanAmountCents(effectivePlan);
  if (amountCents == null) {
    return NextResponse.json({ ok: false, reason: "plano_invalido" }, { status: 400 });
  }
  const txid = account.pixTxid || subscriptionPixTxid(account.uid, effectivePlan);
  const brcode = buildPlatformSubscriptionPixBrcode({ amountCents, txid });
  if (!brcode.ok) {
    return NextResponse.json({ ok: false, reason: brcode.reason, configured: brcode.configured }, { status: 503 });
  }
  return NextResponse.json({
    ok: true as const,
    code: brcode.code,
    txid,
    amountCents,
    planId: effectivePlan,
    configured: brcode.configured,
    devPlaceholder: brcode.devPlaceholder,
  });
}
