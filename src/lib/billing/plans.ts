/**
 * Preços públicos da assinatura — altere apenas aqui para refletir na landing, /planos e catálogo publicado.
 */
export const PUBLIC_BILLING = {
  monthlyCents: 8990,
  annualCents: 79900,
  /** Texto de marketing do desconto anual (ex.: parcelas). */
  annualSavingsLabel: "2 meses grátis",
  currency: "BRL" as const,
  /** Itens exibidos em landing e página de planos (tudo incluso no plano contínuo). */
  includedItems: [
    "Agenda com Google Calendar e Meet",
    "Pacientes, prontuário e modelos por abordagem",
    "Financeiro, pacotes, despesas e rateio entre colegas",
    "Recibo PDF e relatório Receita Saúde",
    "TCLE, contratos e documentos operacionais",
    "Relatórios, MFA, backup diário e DPA público",
    "Chamados de suporte com histórico",
  ],
  cancelAnytimeLine: "Cancele quando quiser, direto em Assinatura.",
  trialDays: 30,
};

export function formatPublicPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
