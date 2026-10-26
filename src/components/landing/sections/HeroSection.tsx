import Link from "next/link";
import HeroCardFan from "@/components/landing/sections/HeroCardFan";

export default function HeroSection() {
  return (
    <section id="inicio" className="landing-hero-scroll relative overflow-x-hidden bg-landing-cream pb-10 pt-[clamp(4.75rem,10vh,6.25rem)] sm:pb-12">
      <div className="site-container relative z-10 flex w-full flex-col items-center text-center">
        <h1 className="landing-display max-w-[15ch] text-[clamp(2.2rem,1.15rem+4.6vw,4.5rem)] leading-[1.02] tracking-[-0.04em] text-ink">
          O consultório organizado em um só lugar.
        </h1>

        <p className="mt-4 max-w-[560px] text-base leading-relaxed text-muted sm:mt-5 sm:text-[1.06rem]">
          Agenda, prontuário, financeiro, recibos Receita Saúde, TCLE, teleconsulta e avaliação do paciente — tudo no painel que você usa no dia a dia da prática clínica.
        </p>

        <div className="mt-6 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:mt-7 sm:max-w-none sm:flex-row sm:items-center">
          <Link href="/cadastro" className="btn-primary w-full sm:w-auto">
            Testar grátis
          </Link>
          <Link href="/#funcionalidades" className="btn-text w-full sm:w-auto">
            Ver como funciona →
          </Link>
        </div>

        <div className="mt-7 w-full sm:mt-8">
          <HeroCardFan />
        </div>
      </div>
    </section>
  );
}
