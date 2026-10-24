"use client";

import { motion } from "motion/react";
import SectionLabel from "@/components/landing/ui/SectionLabel";
import { DashboardMock } from "@/components/landing/Mockups";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { springNav } from "@/lib/motion/presets";

const controls = ["Agenda", "Pacientes", "Financeiro", "Relatórios"];

export default function MediaTourSection() {
  const reduced = useReducedMotion();

  return (
    <section className="bg-landing-cream py-16 sm:py-24">
      <div className="site-container">
        <SectionLabel>Tour do produto</SectionLabel>
        <h2 className="landing-display mt-4 max-w-2xl text-[clamp(1.85rem,1.1rem+2.8vw,3rem)] leading-[1.08] tracking-[-0.03em]">
          Entre no painel do consultório
        </h2>
        <p className="mt-4 max-w-xl text-muted">O mesmo visual do admin — com dados fictícios para você ver como agenda, pacientes e financeiro convivem.</p>

        <motion.div
          className="relative mt-10 overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-[0_32px_80px_rgba(36,48,40,0.1)] sm:mt-14"
          initial={reduced ? false : { opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={springNav}
        >
          <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2 sm:left-6 sm:top-6">
            {controls.map((label, i) => (
              <span
                key={label}
                className={`landing-float-pill static shadow-sm ${i === 0 ? "bg-teal text-white" : "bg-white/95 text-ink"}`}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="landing-mockup-frame pointer-events-none select-none pt-14 sm:pt-16">
            <DashboardMock />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
