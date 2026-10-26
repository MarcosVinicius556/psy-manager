import { buildStaticPixBrcode } from "../pix/brcode";
import { pixProfileReady, type PixProfile } from "../pix/keys";

/** Chave Pix da plataforma (assinatura). Placeholder explícito em dev quando env vazia. */
const DEV_PLACEHOLDER_KEY = "00000000-0000-4000-8000-000000000001";

export function platformBillingPixProfile(): PixProfile & { configured: boolean; devPlaceholder: boolean } {
  const key = (process.env.PSY_BILLING_PIX_KEY || "").trim();
  const nome = (process.env.PSY_BILLING_PIX_NAME || "Psy Manager").trim().slice(0, 25);
  const cidade = (process.env.PSY_BILLING_PIX_CITY || "Sao Paulo").trim().slice(0, 15);
  if (!key) {
    return {
      pixChave: DEV_PLACEHOLDER_KEY,
      pixTipo: "aleatoria",
      pixNome: nome || "Psy Manager DEV",
      pixCidade: cidade || "Sao Paulo",
      configured: false,
      devPlaceholder: true,
    };
  }
  return {
    pixChave: key,
    pixTipo: "aleatoria",
    pixNome: nome,
    pixCidade: cidade,
    configured: true,
    devPlaceholder: false,
  };
}

export function buildPlatformSubscriptionPixBrcode(input: { amountCents: number; txid: string }) {
  const profile = platformBillingPixProfile();
  const ready = pixProfileReady(profile);
  if (!ready.ok && !profile.devPlaceholder) {
    return { ok: false as const, reason: "Pix em configuração", configured: false, devPlaceholder: false };
  }
  const code = buildStaticPixBrcode({
    key: profile.pixChave,
    amount: input.amountCents > 0 ? input.amountCents / 100 : undefined,
    merchantName: profile.pixNome,
    merchantCity: profile.pixCidade,
    txid: input.txid,
  });
  return { ok: true as const, code, configured: profile.configured, devPlaceholder: false };
}
