import Link from "next/link";
import ConsultantActions from "@/components/ConsultantActions";
import { PUBLIC_BILLING, formatPublicPrice } from "@/lib/billing/plans";
import type { PublicPlanCard } from "@/lib/billing/public-plans";
import { formatPrice, periodLabel } from "@/lib/saas/model";
import { consultantEmail } from "@/lib/contact";
import { publicTrialDays } from "@/lib/billing/public-plans";

export default function PlansPricingCards({ plans, compact }: { plans: PublicPlanCard[]; compact?: boolean }) {
  const email = consultantEmail();
  const trialDays = publicTrialDays();
  const paid = plans.filter((plan) => plan.id !== "avaliacao");
  const trial = plans.find((plan) => plan.id === "avaliacao");

  return (
    <div className={`grid gap-5 ${compact ? "md:grid-cols-2" : "lg:grid-cols-3"}`}>
      {trial ? (
        <article className="landing-card-v2 radius-surface border border-leaf bg-white p-6 sm:p-8">
          <p className="text-[0.78rem] font-medium uppercase tracking-[0.16em] text-accent">Gratuito</p>
          <h3 className="mt-3 text-[1.7rem]">{trial.nome}</h3>
          <p className="mt-3 font-num text-2xl text-teal">R$ 0</p>
          <p className="text-sm text-muted">{trialDays} dias de teste · sem cartão</p>
          <ul className="mt-4 grid gap-1 text-sm text-ink">
            {trial.itensInclusos.slice(0, 6).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/cadastro" className="btn-primary w-full sm:w-auto">Testar grátis</Link>
            <Link href="/admin/login" className="btn-text w-full sm:w-auto">Entrar</Link>
          </div>
        </article>
      ) : null}

      {paid.map((plan) => (
        <article
          key={plan.id}
          className={`landing-card-v2 radius-surface border bg-white p-6 sm:p-8 ${plan.destaque ? "border-teal ring-1 ring-teal/20" : "border-leaf"}`}
        >
          {plan.destaque ? (
            <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-teal">Melhor custo</p>
          ) : (
            <p className="text-[0.78rem] font-medium uppercase tracking-[0.16em] text-accent">Uso contínuo</p>
          )}
          <h3 className="mt-3 text-[1.7rem]">{plan.nome}</h3>
          <p className="mt-3 font-num text-2xl text-teal">
            {plan.precoCentavos != null ? formatPublicPrice(plan.precoCentavos) : formatPrice(plan.precoCentavos)}
          </p>
          <p className="text-sm text-muted">
            {periodLabel(plan.periodicidade)}
            {plan.descontoAnualPct ? ` · ${PUBLIC_BILLING.annualSavingsLabel}` : ""}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">{plan.descricao}</p>
          <ul className="mt-4 grid gap-1 text-sm text-ink">
            {plan.itensInclusos.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">{PUBLIC_BILLING.cancelAnytimeLine}</p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/cadastro" className="btn-primary w-full">Começar com {trialDays} dias grátis</Link>
            <ConsultantActions email={email} />
          </div>
        </article>
      ))}
    </div>
  );
}
