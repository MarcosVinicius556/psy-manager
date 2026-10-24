"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import FloatingPill from "@/components/landing/ui/FloatingPill";
import { heroFloatingTags } from "@/components/landing/landing-content";
import { heroStackCards } from "@/components/landing/MiniMocks";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { springNav } from "@/lib/motion/presets";

export default function HeroCardFan() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const x0 = useTransform(scrollYProgress, [0, 0.45], reduced ? [0, 0] : [0, -108]);
  const x1 = useTransform(scrollYProgress, [0, 0.45], reduced ? [0, 0] : [0, -36]);
  const x2 = useTransform(scrollYProgress, [0, 0.45], reduced ? [0, 0] : [0, 36]);
  const x3 = useTransform(scrollYProgress, [0, 0.45], reduced ? [0, 0] : [0, 108]);
  const spreads = [x0, x1, x2, x3];

  const r0 = useTransform(scrollYProgress, [0, 0.45], reduced ? [0, 0] : [0, heroStackCards[0].rotate * 1.4]);
  const r1 = useTransform(scrollYProgress, [0, 0.45], reduced ? [0, 0] : [0, heroStackCards[1].rotate * 1.4]);
  const r2 = useTransform(scrollYProgress, [0, 0.45], reduced ? [0, 0] : [0, heroStackCards[2].rotate * 1.4]);
  const r3 = useTransform(scrollYProgress, [0, 0.45], reduced ? [0, 0] : [0, heroStackCards[3].rotate * 1.4]);
  const rotates = [r0, r1, r2, r3];

  const y0 = useTransform(scrollYProgress, [0, 0.45], reduced ? [0, 0] : [0, 0]);
  const y1 = useTransform(scrollYProgress, [0, 0.45], reduced ? [0, 0] : [4, 0]);
  const y2 = useTransform(scrollYProgress, [0, 0.45], reduced ? [0, 0] : [8, 0]);
  const y3 = useTransform(scrollYProgress, [0, 0.45], reduced ? [0, 0] : [12, 0]);
  const offsets = [y0, y1, y2, y3];

  return (
    <div ref={sectionRef} className="relative w-full">
      <div className="relative mx-auto h-[min(52vw,280px)] w-full max-w-[min(92vw,420px)] sm:h-[320px] sm:max-w-[480px]">
        {heroFloatingTags.map((tag, i) => (
          <FloatingPill key={tag.label} className={tag.className} delay={0.2 + i * 0.08}>
            {tag.label}
          </FloatingPill>
        ))}
        <div className="relative flex h-full w-full items-center justify-center">
          {heroStackCards.map((card, i) => (
            <motion.div
              key={card.id}
              className={`absolute h-[min(48vw,240px)] w-[min(48vw,240px)] overflow-hidden rounded-[20px] border border-black/[0.06] shadow-[0_24px_60px_rgba(36,48,40,0.14)] sm:h-[260px] sm:w-[260px] sm:rounded-[22px] ${card.bg}`}
              style={{
                zIndex: i + 1,
                x: spreads[i],
                rotate: rotates[i],
                y: offsets[i],
              }}
              initial={reduced ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...springNav, delay: 0.12 + i * 0.06 }}
            >
              {card.content}
            </motion.div>
          ))}
        </div>
      </div>
      <div className="h-[40vh] sm:h-[50vh]" aria-hidden />
    </div>
  );
}
