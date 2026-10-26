import Link from "next/link";
import { PUBLIC_BILLING } from "@/lib/billing/plans";
import { fetchPublicPlanCards } from "@/lib/server/public-plans";
import { publicTrialDays } from "@/lib/billing/public-plans";
import PlansPricingCards from "./PlansPricingCards";

export default async function PlansSection() {
  const plans = await fetchPublicPlanCards();
  const trialDays = publicTrialDays();

  return (
    <section id="planos" className="bg-landing-cream py-16 sm:py-24">
      <div className="site-container">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted">Preços e planos</p>
        <h2 className="landing-display mt-4 max-w-2xl text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em]">
          {trialDays} dias grátis, preço público e {PUBLIC_BILLING.cancelAnytimeLine.toLowerCase()}
        </h2>
        <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-muted">
          Tudo incluso em um único plano — sem módulos escondidos. O valor mensal e o anual aparecem abaixo; a contratação paga por Pix entra em breve, e você já pode cancelar ou exportar os dados pelo painel.
        </p>
        <div className="mt-12">
          <PlansPricingCards plans={plans} compact />
        </div>
        <p className="mt-8 text-sm text-muted">
          <Link href="/planos" className="font-semibold text-teal">Ver comparação completa dos planos</Link>
          {" · "}
          Prefere conversar antes? O WhatsApp do consultor continua disponível como opção secundária.
        </p>
      </div>
    </section>
  );
}
