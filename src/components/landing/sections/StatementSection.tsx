"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { MiniAgendaCard, MiniFinanceCard, MiniReceiptCard } from "@/components/landing/MiniMocks";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

export default function StatementSection() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const leftX = useTransform(scrollYProgress, [0.2, 0.55], reduced ? [0, 0] : [-120, 0]);
  const rightX = useTransform(scrollYProgress, [0.2, 0.55], reduced ? [0, 0] : [120, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-landing-cream py-20 sm:py-28">
      <motion.div
        className="pointer-events-none absolute left-[4%] top-1/2 z-0 hidden h-48 w-40 -translate-y-1/2 overflow-hidden rounded-[20px] border border-black/[0.05] shadow-lg md:block"
        style={{ x: leftX }}
        aria-hidden
      >
        <MiniAgendaCard />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute right-[4%] top-1/2 z-0 hidden h-48 w-40 -translate-y-1/2 overflow-hidden rounded-[20px] border border-black/[0.05] shadow-lg md:block"
        style={{ x: rightX }}
        aria-hidden
      >
        <MiniReceiptCard />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute left-[12%] bottom-[18%] z-0 hidden h-44 w-36 overflow-hidden rounded-[18px] opacity-80 md:block"
        style={{ x: leftX }}
        aria-hidden
      >
        <MiniFinanceCard />
      </motion.div>

      <div className="site-container relative z-10">
        <p className="landing-display mx-auto max-w-[22ch] text-center text-[clamp(1.65rem,1rem+2.5vw,2.75rem)] leading-[1.12] tracking-[-0.03em] text-muted">
          Se você atende, registra e cobra no mesmo consultório,{" "}
          <span className="text-ink">o Psy Manager junta isso num fluxo contínuo</span> — da sessão ao recibo, sem planilha no meio.
        </p>
      </div>
    </section>
  );
}
