import Link from "next/link";

export default function LandingFinalCta() {
  return (
    <section
      id="landing-final-cta"
      className="landing-final-cta bg-teal py-16 sm:py-20 pb-[max(4.5rem,calc(3.5rem+env(safe-area-inset-bottom)))] sm:pb-20"
    >
      <div className="site-container text-center">
        <h2 className="landing-display text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em]">
          Pronto para organizar o consultório?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-white/85">
          Avaliação gratuita, sem cartão. Entre, cadastre o essencial e veja agenda e financeiro no mesmo painel.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Link href="/cadastro" className="btn-primary landing-btn-on-teal min-h-11">
            Testar grátis
          </Link>
          <Link href="/admin/login" className="btn-text landing-btn-outline-on-teal min-h-11">
            Entrar
          </Link>
        </div>
      </div>
    </section>
  );
}
