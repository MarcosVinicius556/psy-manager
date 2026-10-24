import dynamic from "next/dynamic";
import Link from "next/link";

const HeroCardFan = dynamic(() => import("@/components/landing/sections/HeroCardFan"), {
  loading: () => <div className="mx-auto h-[min(58vw,300px)] w-full max-w-[min(94vw,520px)] sm:h-[340px] sm:max-w-[560px]" aria-hidden />,
});

export default function HeroSection() {
  return (
    <section id="inicio" className="landing-hero-scroll relative bg-landing-cream pb-8 pt-[clamp(5.5rem,12vh,7.5rem)]">
      <div className="site-container relative z-10 flex w-full flex-col items-center text-center">
        <h1 className="landing-display max-w-[14ch] text-[clamp(2.35rem,1.2rem+5vw,4.75rem)] leading-[1.02] tracking-[-0.04em] text-ink">
          O consultório organizado em um só lugar.
        </h1>

        <div className="mt-10 w-full sm:mt-14">
          <HeroCardFan />
        </div>

        <p className="mt-6 max-w-[540px] text-base leading-relaxed text-muted sm:mt-8 sm:text-[1.08rem]">
          Agenda, prontuário seguro, financeiro com recibos Receita Saúde, TCLE, teleconsulta e avaliação do paciente — no painel que fica do lado de cá da página da clínica.
        </p>

        <div className="mt-8 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:mt-9 sm:max-w-none sm:flex-row sm:items-center">
          <Link href="/cadastro" className="btn-primary landing-pill-cta w-full sm:w-auto">
            Testar grátis
          </Link>
          <Link href="/#funcionalidades" className="btn-text landing-pill-ghost w-full sm:w-auto">
            Ver como funciona →
          </Link>
        </div>
      </div>
    </section>
  );
}
