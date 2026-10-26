import Link from "next/link";
import SectionLabel from "@/components/landing/ui/SectionLabel";
import { dataPromisePoints } from "@/components/landing/landing-content";

export default function DataPromiseSection() {
  return (
    <section id="dados" className="border-y border-[var(--color-border-subtle)] bg-white py-16 sm:py-24">
      <div className="site-container">
        <SectionLabel>Privacidade em linguagem clara</SectionLabel>
        <h2 className="landing-display mt-4 max-w-2xl text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em]">
          O que não fazemos com seus dados
        </h2>
        <ul className="mt-8 grid max-w-3xl gap-3 text-muted">
          {dataPromisePoints.map((point) => (
            <li key={point} className="flex gap-3 text-base leading-relaxed">
              <span className="mt-1 text-teal" aria-hidden>•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold text-teal">
          <Link href="/suboperadores">Lista de suboperadores</Link>
          <Link href="/dpa">Acordo de tratamento (DPA)</Link>
          <Link href="/seguranca">Segurança e backup</Link>
        </div>
      </div>
    </section>
  );
}
