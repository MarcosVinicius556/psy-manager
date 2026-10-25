import Link from "next/link";
import SectionLabel from "@/components/landing/ui/SectionLabel";
import DeviceFrame from "@/components/landing/ui/DeviceFrame";
import { howItWorksSteps } from "@/components/landing/landing-content";
import { landingScreenshots } from "@/lib/landing/screenshots";

export default function HowItWorksSection() {
  return (
    <section id="como-funciona" className="bg-white py-16 sm:py-24">
      <div className="site-container">
        <SectionLabel>Como funciona</SectionLabel>
        <h2 className="landing-display mt-4 max-w-xl text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em]">
          Três passos para o consultório entrar no ritmo
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {howItWorksSteps.map((step) => (
            <li key={step.n} className="landing-card-v2 rounded-[20px] border border-[#e8e4dc] bg-landing-cream/40 p-6">
              <span className="font-num text-3xl font-bold text-teal/30">{step.n}</span>
              <h3 className="landing-display mt-3 text-xl tracking-[-0.02em]">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-muted">
              Depois do cadastro, o início do painel já mostra o mês, a agenda do dia e pendências de pagamento — o restante fica a um clique no menu.
            </p>
            <Link href="/cadastro" className="btn-primary landing-pill-cta mt-6 inline-flex min-h-11">
              Testar grátis
            </Link>
          </div>
          <DeviceFrame shot={landingScreenshots.adminInicio} variant="browser" />
        </div>
        <div className="mt-16 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <DeviceFrame shot={landingScreenshots.avaliacaoPacienteMobile} variant="phone" className="mx-auto" />
          <div>
            <h3 className="landing-display text-2xl tracking-[-0.03em]">Avaliação do paciente por link</h3>
            <p className="mt-3 text-muted">
              Envie um link seguro após a sessão. O paciente avalia sem ver prontuário nem dados de outros atendimentos — útil para feedback rápido e ético.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
