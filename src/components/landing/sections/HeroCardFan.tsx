"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import FloatingPill from "@/components/landing/ui/FloatingPill";
import { heroFloatingTags } from "@/components/landing/landing-content";
import { heroFanShots } from "@/lib/landing/screenshots";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { springNav } from "@/lib/motion/presets";

const rotates = [-7, -2.5, 2.5, 7];
const spreadTargets = [-96, -32, 32, 96];

export default function HeroCardFan() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const x0 = useTransform(scrollYProgress, [0.15, 0.55], reduced ? [0, 0] : [0, spreadTargets[0]]);
  const x1 = useTransform(scrollYProgress, [0.15, 0.55], reduced ? [0, 0] : [0, spreadTargets[1]]);
  const x2 = useTransform(scrollYProgress, [0.15, 0.55], reduced ? [0, 0] : [0, spreadTargets[2]]);
  const x3 = useTransform(scrollYProgress, [0.15, 0.55], reduced ? [0, 0] : [0, spreadTargets[3]]);
  const spreads = [x0, x1, x2, x3];

  const r0 = useTransform(scrollYProgress, [0.15, 0.55], reduced ? [rotates[0], rotates[0]] : [rotates[0] * 0.6, rotates[0]]);
  const r1 = useTransform(scrollYProgress, [0.15, 0.55], reduced ? [rotates[1], rotates[1]] : [rotates[1] * 0.6, rotates[1]]);
  const r2 = useTransform(scrollYProgress, [0.15, 0.55], reduced ? [rotates[2], rotates[2]] : [rotates[2] * 0.6, rotates[2]]);
  const r3 = useTransform(scrollYProgress, [0.15, 0.55], reduced ? [rotates[3], rotates[3]] : [rotates[3] * 0.6, rotates[3]]);
  const rotatesMotion = [r0, r1, r2, r3];

  return (
    <div ref={sectionRef} className="relative w-full">
      <div className="relative mx-auto h-[min(58vw,300px)] w-full max-w-[min(94vw,520px)] sm:h-[340px] sm:max-w-[560px]">
        {heroFloatingTags.map((tag, i) => (
          <FloatingPill key={tag.label} className={tag.className} delay={0.15 + i * 0.07}>
            {tag.label}
          </FloatingPill>
        ))}
        <div className="relative flex h-full w-full items-center justify-center">
          {heroFanShots.map((shot, i) => (
            <motion.div
              key={shot.src}
              className="absolute h-[min(50vw,260px)] w-[min(50vw,260px)] overflow-hidden rounded-[18px] border border-black/[0.08] bg-white shadow-[0_20px_50px_rgba(36,48,40,0.14)] sm:h-[280px] sm:w-[280px] sm:rounded-[20px]"
              style={{
                zIndex: i + 1,
                x: spreads[i],
                rotate: rotatesMotion[i],
              }}
              initial={reduced ? false : { opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ ...springNav, delay: 0.1 + i * 0.05 }}
            >
              <Image
                src={shot.src}
                alt={shot.alt}
                width={shot.width}
                height={shot.height}
                className="h-full w-full object-cover object-top"
                sizes="(max-width: 640px) 50vw, 280px"
                priority={i === heroFanShots.length - 1}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
