import SectionLabel from "@/components/landing/ui/SectionLabel";
import { bentoFeatures } from "@/components/landing/landing-content";

export default function BentoGridSection() {
  return (
    <section id="seguranca" className="bg-white py-16 sm:py-24">
      <div className="site-container">
        <SectionLabel>Módulos</SectionLabel>
        <h2 className="landing-display mt-4 max-w-2xl text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em]">
          Do TCLE ao Meet, com recibo e sala compartilhada
        </h2>
        <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {bentoFeatures.map(({ icon: Icon, label, title, text, accent }) => (
            <article
              key={title}
              className="landing-card-v2 flex min-h-[220px] flex-col rounded-[22px] border border-[#ebe8e0] bg-landing-cream/50 p-6"
            >
              <span className={`inline-flex w-fit rounded-xl p-2.5 ${accent}`}>
                <Icon size={22} />
              </span>
              <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
              <h3 className="landing-display mt-2 text-xl tracking-[-0.02em]">{title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
