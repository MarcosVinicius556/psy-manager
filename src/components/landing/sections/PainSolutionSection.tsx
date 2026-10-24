import SectionLabel from "@/components/landing/ui/SectionLabel";
import { painPoints } from "@/components/landing/landing-content";

export default function PainSolutionSection() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="site-container">
        <SectionLabel>Do caos ao fluxo</SectionLabel>
        <h2 className="landing-display mt-4 max-w-2xl text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em]">
          Menos planilha, mais tempo com o paciente
        </h2>
        <p className="mt-4 max-w-2xl text-muted">
          Um sistema pensado para a rotina do psicólogo: marcar sessão, registrar evolução, cobrar e emitir documentos sem depender de planilhas ou de vários apps soltos.
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {painPoints.map((item) => (
            <li key={item.pain} className="landing-card-v2 rounded-[20px] border border-[#ebe8e0] bg-landing-cream/40 p-6">
              <p className="text-sm font-semibold text-accent">{item.pain}</p>
              <p className="landing-display mt-3 text-xl tracking-[-0.02em] text-ink">{item.solution}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
