import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import LegalPlaceholderBanner from "@/components/legal/LegalPlaceholderBanner";
import { formatLegalVersionLine, LEGAL_FOOTER_LINKS } from "@/lib/legal/config";
import type { LegalSection } from "@/lib/legal/sections";

type Props = {
  title: string;
  description: string;
  version: string;
  effectiveFrom: string;
  sections: LegalSection[];
  related?: { href: string; label: string }[];
};

export default function LegalDocumentPage({ title, description, version, effectiveFrom, sections, related }: Props) {
  const versionLine = formatLegalVersionLine({ version, effectiveFrom });

  return (
    <article className="site-container py-16 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <LegalPlaceholderBanner />
        <BrandLogo height={40} className="max-w-[70vw]" />
        <h1 className="mt-5 text-[clamp(2rem,1.4rem+2.4vw,3rem)] leading-[1.15] text-teal">{title}</h1>
        <p className="mt-2 text-sm font-medium text-teal/90">{versionLine}</p>
        <p className="mt-3 text-sm text-muted">{description}</p>

        <nav className="mt-8 rounded-2xl border border-[#d7e0d8] bg-white/80 p-4 sm:p-5" aria-label="Índice">
          <p className="text-xs font-semibold tracking-[0.08em] text-teal uppercase">Índice</p>
          <ol className="mt-3 space-y-2 text-sm">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="inline-flex min-h-10 items-center font-medium text-teal underline-offset-2 hover:underline">
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-8 space-y-8 leading-relaxed text-muted">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-[clamp(1.35rem,1.1rem+1vw,1.75rem)] leading-tight text-teal">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="mt-3">{paragraph}</p>
              ))}
            </section>
          ))}
        </div>

        {related?.length ? (
          <div className="mt-10 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
            {related.map((item) => (
              <Link key={item.href} href={item.href} className="inline-flex min-h-11 items-center font-semibold text-teal">
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-12 border-t border-[#d7e0d8] pt-6">
          <p className="text-xs font-semibold tracking-[0.08em] text-teal uppercase">Documentos legais</p>
          <ul className="mt-3 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-4">
            {LEGAL_FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-10 items-center text-sm text-muted hover:text-teal">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
