"use client";

import Link from "next/link";
import SectionLabel from "@/components/landing/ui/SectionLabel";
import { carouselCases } from "@/components/landing/landing-content";

export default function UseCaseCarouselSection() {
  return (
    <section className="bg-landing-cream py-16 sm:py-24">
      <div className="site-container grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end lg:gap-12">
        <div>
          <SectionLabel>Casos de uso</SectionLabel>
          <h2 className="landing-display mt-4 text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em]">
            O que o painel resolve no dia a dia
          </h2>
          <p className="mt-4 text-muted">Arraste para ver fluxos reais do produto — cada card é um módulo que você já encontra no admin.</p>
          <Link href="/cadastro" className="btn-primary landing-pill-cta mt-8 inline-flex min-h-11 items-center">
            Testar grátis
          </Link>
        </div>

        <div className="min-w-0">
          <ul
            className="landing-feature-scroll flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Casos de uso"
          >
            {carouselCases.map((item) => (
              <li
                key={item.title}
                className={`relative flex w-[min(72vw,260px)] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[22px] bg-gradient-to-br ${item.tone} p-5 text-white shadow-lg`}
              >
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/75">Módulo</p>
                  <h3 className="landing-display mt-2 text-2xl tracking-[-0.02em]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/85">{item.text}</p>
                </div>
                <div className="mt-6">
                  <div className="h-1 overflow-hidden rounded-full bg-white/25">
                    <div className="h-full rounded-full bg-white" style={{ width: `${Math.round(item.progress * 100)}%` }} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
