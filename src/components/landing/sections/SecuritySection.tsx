import Link from "next/link";
import SectionLabel from "@/components/landing/ui/SectionLabel";
import { securityPoints } from "@/components/landing/landing-content";

export default function SecuritySection() {
  return (
    <section id="seguranca" className="bg-white py-16 sm:py-24">
      <div className="site-container">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>Segurança e LGPD</SectionLabel>
          <h2 className="landing-display mt-4 text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em]">
            Dados clínicos ficam na conta de quem atende
          </h2>
          <p className="mt-4 text-muted">
            Acesso individual, HTTPS e separação entre operação da plataforma e prontuário. Sem inventar certificações: o que está no produto hoje está descrito abaixo.
          </p>
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {securityPoints.map((item) => (
            <li key={item.title} className="landing-card-v2 rounded-[20px] border border-[#ebe8e0] bg-landing-cream/30 p-6">
              <h3 className="text-lg font-semibold text-teal">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/seguranca" className="btn-text landing-pill-ghost min-h-11">
            Página de segurança
          </Link>
          <Link href="/privacidade" className="btn-text landing-pill-ghost min-h-11">
            Política de privacidade
          </Link>
        </div>
      </div>
    </section>
  );
}
