import { PUBLIC_BILLING } from "./plans";
import type { PlanDefinition } from "@/lib/saas/model";
import { DEFAULT_PLANS, TRIAL_DAYS } from "@/lib/saas/model";

export type PublicPlanCard = {
  id: string;
  nome: string;
  descricao: string;
  precoCentavos: number | null;
  periodicidade: PlanDefinition["periodicidade"];
  itensInclusos: string[];
  destaque: boolean;
  descontoAnualPct: number | null;
  disponivel: boolean;
};

function annualDiscountPct(monthlyCents: number, annualCents: number) {
  if (monthlyCents <= 0) return null;
  const fullYear = monthlyCents * 12;
  if (fullYear <= annualCents) return null;
  return Math.round((1 - annualCents / fullYear) * 100);
}

/** Mescla catálogo remoto com preços/itens do config local (fonte da verdade para marketing). */
export function mergePublicPlans(remote: PlanDefinition[]): PublicPlanCard[] {
  const discount = annualDiscountPct(PUBLIC_BILLING.monthlyCents, PUBLIC_BILLING.annualCents);
  const byId = new Map(remote.map((plan) => [plan.id, plan]));
  const base = remote.length ? remote : DEFAULT_PLANS;

  return base
    .filter((plan) => plan.id !== "legado")
    .map((plan) => {
      const row = byId.get(plan.id) ?? plan;
      let preco = row.precoCentavos;
      if (plan.id === "consultorio" || (plan.periodicidade === "mensal" && plan.id !== "avaliacao")) {
        preco = PUBLIC_BILLING.monthlyCents;
      }
      if (plan.id === "consultorio_anual" || plan.periodicidade === "anual") {
        preco = PUBLIC_BILLING.annualCents;
      }
      const itensInclusos =
        Array.isArray((row as PlanDefinition & { itensInclusos?: string[] }).itensInclusos) &&
        (row as PlanDefinition & { itensInclusos?: string[] }).itensInclusos!.length
          ? (row as PlanDefinition & { itensInclusos?: string[] }).itensInclusos!
          : PUBLIC_BILLING.includedItems;
      const destaque =
        typeof (row as PlanDefinition & { destaque?: boolean }).destaque === "boolean"
          ? (row as PlanDefinition & { destaque?: boolean }).destaque!
          : plan.periodicidade === "anual";
      return {
        id: plan.id,
        nome: row.nome,
        descricao: row.descricao,
        precoCentavos: plan.id === "avaliacao" ? 0 : preco,
        periodicidade: row.periodicidade,
        itensInclusos,
        destaque,
        descontoAnualPct: plan.periodicidade === "anual" ? discount : null,
        disponivel: row.disponivel,
      };
    })
    .sort((a, b) => {
      const order = (id: string) => (id === "avaliacao" ? 0 : id.includes("anual") ? 2 : 1);
      return order(a.id) - order(b.id);
    });
}

export function publicTrialDays() {
  return TRIAL_DAYS || PUBLIC_BILLING.trialDays;
}
