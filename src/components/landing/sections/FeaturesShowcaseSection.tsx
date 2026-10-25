import SectionLabel from "@/components/landing/ui/SectionLabel";
import DeviceFrame from "@/components/landing/ui/DeviceFrame";
import { featureShowcase } from "@/components/landing/landing-content";

export default function FeaturesShowcaseSection() {
  return (
    <section id="funcionalidades" className="bg-landing-cream py-16 sm:py-24">
      <div className="site-container">
        <SectionLabel>Funcionalidades</SectionLabel>
        <h2 className="landing-display mt-4 max-w-2xl text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em]">
          Veja o painel como você vai usar
        </h2>
        <p className="mt-4 max-w-2xl text-muted">
          Telas reais do sistema, com dados de demonstração e nomes fictícios — o mesmo visual após o login.
        </p>

        <div className="mt-12 space-y-16 sm:mt-20 sm:space-y-24">
          {featureShowcase.map((block, index) => (
            <div
              key={block.title}
              className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-12 ${index % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""}`}
            >
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">{block.label}</p>
                <h3 className="landing-display mt-3 text-[clamp(1.55rem,1.2rem+1.4vw,2.35rem)] leading-[1.12] tracking-[-0.03em]">
                  {block.title}
                </h3>
                <p className="mt-4 leading-relaxed text-muted">{block.text}</p>
                {block.bullets ? (
                  <ul className="mt-4 grid gap-2 text-sm text-ink">
                    {block.bullets.map((b) => (
                      <li key={b} className="flex gap-2">
                        <span className="text-teal" aria-hidden>•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <DeviceFrame shot={block.shot} variant={block.frame} className="mx-auto w-full max-w-xl" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
