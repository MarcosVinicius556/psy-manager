import type { Metadata } from "next";
import Footer from "@/components/footer";
import PlansPricingCards from "@/components/landing/PlansPricingCards";
import SectionLabel from "@/components/landing/ui/SectionLabel";
import { PUBLIC_BILLING } from "@/lib/billing/plans";
import { fetchPublicPlanCards } from "@/lib/server/public-plans";
import { publicTrialDays } from "@/lib/billing/public-plans";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Planos e preços — Psy Manager",
  description: `Software para psicólogos com teste de ${publicTrialDays()} dias, plano mensal e anual com tudo incluso. Cancele quando quiser.`,
};

export default async function PlanosPage() {
  const plans = await fetchPublicPlanCards();
  const trialDays = publicTrialDays();

  return (
    <div className="landing min-h-screen bg-landing-cream">
      <header className="border-b border-[var(--color-border-subtle)] bg-white/80 backdrop-blur">
        <div className="site-container flex min-h-14 items-center justify-between gap-4 py-3">
          <Link href="/" className="font-semibold text-teal">Psy Manager</Link>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/conteudos" className="text-muted hover:text-teal">Conteúdos</Link>
            <Link href="/cadastro" className="btn-primary">Testar grátis</Link>
          </div>
        </div>
      </header>

      <main className="site-container py-16 sm:py-20">
        <SectionLabel>Planos</SectionLabel>
        <h1 className="landing-display mt-4 max-w-3xl text-[clamp(2rem,1.2rem+3vw,3.2rem)] leading-[1.06] tracking-[-0.03em]">
          Um plano, tudo incluso — com preço na vitrine
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          {trialDays} dias de avaliação sem cartão. Depois, escolha mensal ou anual ({PUBLIC_BILLING.annualSavingsLabel} no anual). {PUBLIC_BILLING.cancelAnytimeLine}
        </p>

        <div className="mt-12">
          <PlansPricingCards plans={plans} />
        </div>

        <section className="mt-16 rounded-surface border border-[var(--color-border-subtle)] bg-white p-6 sm:p-8">
          <h2 className="text-2xl text-teal">O que está incluso</h2>
          <ul className="mt-4 grid gap-2 text-sm text-ink sm:grid-cols-2">
            {PUBLIC_BILLING.includedItems.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-teal" aria-hidden>✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">
            Exportação de dados e cancelamento em um clique ficam em Assinatura. A cobrança recorrente por Pix será habilitada na próxima onda financeira — sem taxa de gateway enquanto a confirmação for manual.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
