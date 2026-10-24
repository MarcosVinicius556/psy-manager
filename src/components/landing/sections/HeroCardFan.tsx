"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import LandingScreenshot from "@/components/landing/ui/LandingScreenshot";
import FloatingPill from "@/components/landing/ui/FloatingPill";
import { heroFloatingTags } from "@/components/landing/landing-content";
import { heroFanShots } from "@/lib/landing/screenshots";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { springNav } from "@/lib/motion/presets";

const baseRotates = [-5.5, -2, 2, 5.5];
const baseSpreads = [-48, -16, 16, 48];
const scrollSpreads = [-80, -26, 26, 80];

export default function HeroCardFan() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const x0 = useTransform(scrollYProgress, [0, 0.35], reduced ? [baseSpreads[0], baseSpreads[0]] : [baseSpreads[0], scrollSpreads[0]]);
  const x1 = useTransform(scrollYProgress, [0, 0.35], reduced ? [baseSpreads[1], baseSpreads[1]] : [baseSpreads[1], scrollSpreads[1]]);
  const x2 = useTransform(scrollYProgress, [0, 0.35], reduced ? [baseSpreads[2], baseSpreads[2]] : [baseSpreads[2], scrollSpreads[2]]);
  const x3 = useTransform(scrollYProgress, [0, 0.35], reduced ? [baseSpreads[3], baseSpreads[3]] : [baseSpreads[3], scrollSpreads[3]]);
  const spreads = [x0, x1, x2, x3];

  const r0 = useTransform(scrollYProgress, [0, 0.35], reduced ? [baseRotates[0], baseRotates[0]] : [baseRotates[0], baseRotates[0] * 1.35]);
  const r1 = useTransform(scrollYProgress, [0, 0.35], reduced ? [baseRotates[1], baseRotates[1]] : [baseRotates[1], baseRotates[1] * 1.35]);
  const r2 = useTransform(scrollYProgress, [0, 0.35], reduced ? [baseRotates[2], baseRotates[2]] : [baseRotates[2], baseRotates[2] * 1.35]);
  const r3 = useTransform(scrollYProgress, [0, 0.35], reduced ? [baseRotates[3], baseRotates[3]] : [baseRotates[3], baseRotates[3] * 1.35]);
  const rotatesMotion = [r0, r1, r2, r3];

  return (
    <div ref={sectionRef} className="relative w-full">
      <div className="relative mx-auto h-[200px] w-full max-w-[min(96vw,540px)] sm:h-[240px] sm:max-w-[580px] lg:h-[260px]">
        {heroFloatingTags.map((tag, i) => (
          <FloatingPill key={tag.label} className={tag.className} delay={0.08 + i * 0.05}>
            {tag.label}
          </FloatingPill>
        ))}
        <div className="relative flex h-full w-full items-center justify-center">
          {heroFanShots.map((shot, i) => (
            <motion.div
              key={shot.src}
              className="absolute h-[min(44vw,200px)] w-[min(44vw,200px)] overflow-hidden rounded-[16px] border border-black/[0.1] bg-white opacity-100 shadow-[0_16px_44px_rgba(36,48,40,0.16)] sm:h-[220px] sm:w-[220px] sm:rounded-[18px] lg:h-[240px] lg:w-[240px]"
              style={{
                zIndex: i + 1,
                x: spreads[i],
                rotate: rotatesMotion[i],
              }}
              initial={reduced ? false : { scale: 0.97 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...springNav, delay: 0.04 + i * 0.04 }}
            >
              <LandingScreenshot
                shot={shot}
                className="h-full object-cover object-top"
                sizes="(max-width: 640px) 44vw, 240px"
                priority
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
