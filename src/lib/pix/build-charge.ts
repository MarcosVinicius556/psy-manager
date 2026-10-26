import { buildStaticPixBrcode } from "./brcode";
import { pixProfileReady, type PixProfile } from "./keys";
import { paymentPixTxid } from "./payment-txid";
import type { ClinicMember, Payment } from "@/lib/admin/types";
import { remainingAmount } from "@/lib/admin/finance";

export function memberPixProfile(member: ClinicMember): PixProfile {
  return {
    pixChave: member.pixChave,
    pixTipo: member.pixTipo,
    pixNome: member.pixNome || member.nome,
    pixCidade: member.pixCidade || member.enderecoCidade,
  };
}

export function buildPaymentPixBrcode(member: ClinicMember, payment: Payment) {
  const profile = memberPixProfile(member);
  const ready = pixProfileReady(profile);
  if (!ready.ok) {
    return { ok: false as const, reason: `Configure em Configurações: ${ready.missing.join(", ")}.` };
  }
  const amount = remainingAmount(payment);
  const txid = payment.pixTxid || paymentPixTxid(payment.id);
  const code = buildStaticPixBrcode({
    key: profile.pixChave,
    amount: amount > 0 ? amount : undefined,
    merchantName: profile.pixNome,
    merchantCity: profile.pixCidade,
    txid,
  });
  return { ok: true as const, code, txid, amount };
}
