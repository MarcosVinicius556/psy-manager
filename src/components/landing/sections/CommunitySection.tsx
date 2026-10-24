"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { gridTiles } from "@/components/landing/landing-content";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

function AvatarTile({ initials, hue, className }: { initials: string; hue: string; className?: string }) {
  return (
    <div
      className={`flex aspect-[4/5] items-end justify-start overflow-hidden rounded-[18px] p-3 shadow-[0_8px_24px_rgba(36,48,40,0.08)] ${className ?? ""}`}
      style={{ background: `linear-gradient(145deg, ${hue}22, ${hue}55)` }}
    >
      <span
        className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: hue }}
        aria-hidden
      >
        {initials}
      </span>
    </div>
  );
}

export default function CommunitySection() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const row1 = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [-40, 40]);
  const row2 = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [30, -30]);

  const rowA = gridTiles.slice(0, 6);
  const rowB = gridTiles.slice(6, 12);

  return (
    <section ref={ref} className="overflow-hidden bg-landing-cream py-16 sm:py-24">
      <div className="site-container text-center">
        <h2 className="landing-display text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em]">
          Tem um lugar para você aqui
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-muted">
          Psicólogos em consultório solo, sala compartilhada ou atendimento híbrido — sem fotos de banco, só o tipo de uso que o produto cobre.
        </p>
      </div>

      <div className="relative mt-12 space-y-4 sm:mt-16">
        <motion.div className="flex gap-3 px-4 sm:gap-4 sm:px-8" style={{ x: row1 }}>
          {rowA.map((t) => (
            <div key={t.initials} className="w-[min(28vw,140px)] shrink-0">
              <AvatarTile initials={t.initials} hue={t.hue} />
            </div>
          ))}
        </motion.div>
        <motion.div className="flex gap-3 px-8 sm:gap-4 sm:px-16" style={{ x: row2 }}>
          {rowB.map((t) => (
            <div key={t.initials} className="w-[min(28vw,140px)] shrink-0">
              <AvatarTile initials={t.initials} hue={t.hue} />
            </div>
          ))}
        </motion.div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[min(72vw,280px)] rounded-[24px] border border-white/80 bg-white/90 p-6 shadow-[0_32px_80px_rgba(36,48,40,0.15)] backdrop-blur-sm">
            <span className="landing-float-pill static bg-accent text-white">@consultório</span>
            <p className="landing-display mt-4 text-2xl tracking-[-0.03em]">Sua conta, seus pacientes</p>
            <p className="mt-2 text-sm text-muted">Cada profissional com login próprio — no Psy Manager</p>
          </div>
        </div>
      </div>
    </section>
  );
}
