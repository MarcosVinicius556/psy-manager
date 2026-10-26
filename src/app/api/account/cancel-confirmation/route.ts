import { NextResponse } from "next/server";
import { mapAccount } from "@/lib/saas/account-store";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuthUser } from "@/lib/server/require-auth";
import { sendOperationalEmail } from "@/lib/server/operational-mail";

export async function POST(req: Request) {
  const auth = await requireAuthUser(req);
  if ("error" in auth) return auth.error;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ ok: false, reason: "admin_indisponivel" }, { status: 503 });

  const snap = await db.collection("users").doc(auth.uid).get();
  const account = mapAccount(auth.uid, snap.data());
  const body = (await req.json().catch(() => ({}))) as { reason?: string };
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  const accessLine =
    account.cancelAtPeriodEnd && account.accessUntilMillis
      ? `Seu acesso integral segue até ${new Date(account.accessUntilMillis).toLocaleString("pt-BR")}. Depois disso você poderá consultar e exportar os dados, conforme a LGPD.`
      : "Novos lançamentos foram pausados. Seus dados permanecem disponíveis para consulta e exportação em Assinatura.";

  const text = `Olá${account.nome ? `, ${account.nome}` : ""},

Confirmamos o cancelamento da sua conta Psy Manager.

${accessLine}

${reason ? `Motivo informado: ${reason}\n\n` : ""}Se não foi você, responda este e-mail imediatamente.

— Equipe Psy Manager`;

  if (account.email) {
    await sendOperationalEmail({
      to: account.email,
      subject: "Cancelamento confirmado — Psy Manager",
      text,
    });
  }

  return NextResponse.json({ ok: true });
}
