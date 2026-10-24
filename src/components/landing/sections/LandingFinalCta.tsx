import Link from "next/link";

export default function LandingFinalCta() {
  return (
    <section className="bg-teal py-16 text-white sm:py-20">
      <div className="site-container text-center">
        <h2 className="landing-display text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em] text-white">
          Pronto para organizar o consultório?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-white/80">
          Avaliação gratuita, sem cartão. Entre, cadastre o essencial e veja agenda e financeiro no mesmo painel.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link href="/cadastro" className="btn-primary min-h-11 border-white bg-white text-teal hover:bg-white/90">
            Testar grátis
          </Link>
          <Link href="/admin/login" className="btn-text min-h-11 border-white/60 text-white hover:bg-white/10">
            Entrar
          </Link>
        </div>
      </div>
    </section>
  );
}
