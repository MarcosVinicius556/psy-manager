import SectionLabel from "@/components/landing/ui/SectionLabel";
import { journeyStages } from "@/components/landing/landing-content";

export default function JourneySection() {
  return (
    <section id="jornada" className="bg-white py-16 sm:py-24">
      <div className="site-container">
        <SectionLabel>Jornada da sessão</SectionLabel>
        <h2 className="landing-display mt-4 max-w-2xl text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em]">
          Antes, durante e depois — no mesmo painel
        </h2>
        <p className="mt-4 max-w-2xl text-muted">
          Organizamos o produto como você vive o consultório: preparar o encontro, registrar o cuidado e fechar o mês sem planilhas paralelas.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {journeyStages.map((stage) => (
            <article key={stage.title} className="landing-card-v2 radius-surface border border-[var(--color-border-subtle)] bg-landing-cream p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{stage.phase}</p>
              <h3 className="mt-2 text-xl text-teal">{stage.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{stage.text}</p>
              <ul className="mt-4 grid gap-1 text-sm text-ink">
                {stage.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
