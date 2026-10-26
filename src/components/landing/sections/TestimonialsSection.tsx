import SectionLabel from "@/components/landing/ui/SectionLabel";
import { LANDING_TESTIMONIALS, testimonialsVisible } from "@/lib/landing/testimonials";

export default function TestimonialsSection() {
  if (!testimonialsVisible()) return null;
  return (
    <section id="depoimentos" className="bg-landing-cream py-16 sm:py-24">
      <div className="site-container">
        <SectionLabel>Depoimentos</SectionLabel>
        <h2 className="landing-display mt-4 max-w-2xl text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em]">
          Quem usa no dia a dia
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {LANDING_TESTIMONIALS.map((item) => (
            <blockquote key={item.name} className="radius-surface border border-[var(--color-border-subtle)] bg-white p-6">
              <p className="text-lg leading-relaxed text-ink">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-4 text-sm text-muted">
                <strong className="text-teal">{item.name}</strong> — {item.role}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
