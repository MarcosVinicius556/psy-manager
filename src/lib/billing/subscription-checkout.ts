/**
 * Gancho para assinatura paga (Onda D2 — Pix). Sem gateway nesta onda.
 */
export type SubscriptionCheckoutState =
  | ""
  | "aguardando_provedor"
  | "aguardando_confirmacao_pix";

export function describeCheckoutState(state: SubscriptionCheckoutState) {
  if (state === "aguardando_confirmacao_pix") {
    return "Aguardando confirmação do Pix informado. Um administrador valida o pagamento na plataforma.";
  }
  if (state === "aguardando_provedor") {
    return "Contratação registrada; o provedor de pagamento ainda não está configurado.";
  }
  return "";
}
