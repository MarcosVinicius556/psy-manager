import SectionLabel from "@/components/landing/ui/SectionLabel";
import { exclusiveHighlights } from "@/components/landing/landing-content";

export default function ExclusiveSection() {
  return (
    <section id="so-psy-manager" className="bg-landing-cream py-16 sm:py-24">
      <div className="site-container">
        <SectionLabel>Só no Psy Manager</SectionLabel>
        <h2 className="landing-display mt-4 max-w-2xl text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em]">
          O que a concorrência não publica na vitrine
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exclusiveHighlights.map((item) => (
            <article key={item.title} className="radius-surface border border-[var(--color-border-subtle)] bg-white p-5">
              <h3 className="text-lg font-semibold text-teal">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
