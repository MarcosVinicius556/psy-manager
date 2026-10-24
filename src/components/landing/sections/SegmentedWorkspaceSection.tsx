"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import SectionLabel from "@/components/landing/ui/SectionLabel";
import { segmentIcons, workspaceTabs } from "@/components/landing/landing-content";
import { springNav } from "@/lib/motion/presets";

type TabKey = keyof typeof workspaceTabs;

export default function SegmentedWorkspaceSection() {
  const [tab, setTab] = useState<TabKey>("solo");

  return (
    <section id="funcionalidades" className="bg-landing-cream py-16 sm:py-24">
      <div className="site-container grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-16">
        <div>
          <SectionLabel>Funcionalidades</SectionLabel>
          <h2 className="landing-display mt-4 text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em]">
            Ferramentas para o consultório real
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-muted">
            Sozinho ou em sala compartilhada: a mesma base de agenda, prontuário e financeiro, com o recorte certo para cada forma de trabalho.
          </p>
          <Link href="/#seguranca" className="mt-6 inline-flex min-h-11 items-center font-semibold text-teal">
            Segurança e LGPD →
          </Link>
          <div className="mt-10 hidden flex-wrap gap-4 sm:flex">
            {segmentIcons.map((Icon, i) => (
              <span key={i} className="grid h-11 w-11 place-items-center rounded-2xl border border-[#e0e6e0] bg-white text-teal">
                <Icon size={20} />
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="landing-segment relative mb-6 inline-flex rounded-full border border-[#ddd8cf] bg-white p-1">
            {(Object.keys(workspaceTabs) as TabKey[]).map((key) => {
              const active = tab === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setTab(key)}
                  className={`relative z-10 min-h-11 rounded-full px-5 text-sm font-semibold transition-colors ${
                    active ? "text-white" : "text-muted"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="landing-segment-pill"
                      className="absolute inset-0 rounded-full bg-teal"
                      transition={springNav}
                    />
                  )}
                  <span className="relative">{workspaceTabs[key].label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative min-h-[280px] rounded-[24px] border border-black/[0.06] bg-white p-4 shadow-[0_20px_50px_rgba(36,48,40,0.08)] sm:p-6">
            <AnimatePresence mode="wait">
              <motion.ul
                key={tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="grid gap-3 sm:grid-cols-2"
              >
                {workspaceTabs[tab].cards.map((card) => (
                  <li
                    key={card.title}
                    className="rounded-[18px] border border-[#e8ece8] bg-landing-cream/80 p-4 transition-shadow hover:shadow-md"
                  >
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-accent">{card.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{card.desc}</p>
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
