import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/footer";
import { ARTICLES } from "@/content/articles";

export const metadata: Metadata = {
  title: "Conteúdos — Psy Manager",
  description: "Artigos sobre Receita Saúde, LGPD, CFP e gestão do consultório de psicologia.",
};

export default function ConteudosPage() {
  const sorted = [...ARTICLES].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return (
    <div className="min-h-screen bg-landing-cream">
      <header className="border-b border-[var(--color-border-subtle)] bg-white">
        <div className="site-container flex min-h-14 items-center justify-between py-3">
          <Link href="/" className="font-semibold text-teal">Psy Manager</Link>
          <Link href="/planos" className="text-sm text-muted hover:text-teal">Planos</Link>
        </div>
      </header>
      <main className="site-container py-16">
        <h1 className="landing-display text-4xl text-teal">Conteúdos</h1>
        <p className="mt-3 max-w-2xl text-muted">Guias práticos com fontes do CFP e da ANPD. Atualizado em outubro de 2026.</p>
        <ul className="mt-10 grid gap-4">
          {sorted.map((article) => (
            <li key={article.slug} className="radius-surface border border-[var(--color-border-subtle)] bg-white p-5">
              <Link href={`/conteudos/${article.slug}`} className="text-xl font-semibold text-teal hover:underline">
                {article.title}
              </Link>
              <p className="mt-2 text-sm text-muted">{article.description}</p>
              <p className="mt-2 text-xs text-muted">Atualizado em {new Date(article.updatedAt).toLocaleDateString("pt-BR")}</p>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
