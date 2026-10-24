"use client";

import Link from "next/link";
import { motion } from "motion/react";
import SectionLabel from "@/components/landing/ui/SectionLabel";
import { AgendaMock, FinanceMock } from "@/components/landing/Mockups";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { springNav } from "@/lib/motion/presets";

export default function SplitIntroSection() {
  const reduced = useReducedMotion();

  return (
    <section className="bg-landing-cream py-16 sm:py-24">
      <div className="site-container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionLabel>Psy Manager</SectionLabel>
          <h2 className="landing-display mt-4 text-[clamp(2rem,1.2rem+3vw,3.25rem)] leading-[1.06] tracking-[-0.035em]">
            Agenda, prontuário e caixa sem trocar de aba.
          </h2>
          <p className="mt-5 max-w-lg text-[1.05rem] leading-relaxed text-muted">
            O painel que você usa depois da sessão: quem veio, o que falta registrar, qual recibo sair e como está o mês — com dados de demonstração abaixo, não promessas vazias.
          </p>
          <Link href="/cadastro" className="btn-primary landing-pill-cta mt-8 inline-flex min-h-11 items-center">
            Testar grátis
          </Link>
        </div>

        <div className="relative min-h-[320px] sm:min-h-[380px]">
          <motion.div
            className="relative z-10 origin-bottom-right"
            initial={reduced ? false : { opacity: 0, x: 48, y: 64, rotate: 4 }}
            whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={springNav}
          >
            <div className="landing-mockup-frame">
              <AgendaMock />
            </div>
          </motion.div>
          <motion.div
            className="absolute -bottom-4 -left-2 z-20 w-[min(88%,340px)] sm:-left-6"
            initial={reduced ? false : { opacity: 0, x: -32, y: 40 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ ...springNav, delay: 0.1 }}
          >
            <div className="landing-mockup-frame scale-[0.92] shadow-[0_32px_80px_rgba(36,48,40,0.18)]">
              <FinanceMock />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
