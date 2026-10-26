import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/footer";
import { ARTICLES, articleBySlug } from "@/content/articles";

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) return { title: "Artigo não encontrado" };
  return {
    title: `${article.title} — Psy Manager`,
    description: article.description,
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) notFound();

  return (
    <div className="min-h-screen bg-landing-cream">
      <header className="border-b border-[var(--color-border-subtle)] bg-white">
        <div className="site-container flex min-h-14 items-center justify-between py-3 text-sm">
          <Link href="/conteudos" className="text-teal">← Conteúdos</Link>
          <Link href="/planos" className="text-muted hover:text-teal">Planos</Link>
        </div>
      </header>
      <article className="site-container max-w-3xl py-16">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          Atualizado em {new Date(article.updatedAt).toLocaleDateString("pt-BR")}
        </p>
        <h1 className="landing-display mt-3 text-4xl text-teal">{article.title}</h1>
        <p className="mt-4 text-lg text-muted">{article.description}</p>
        <div className="prose prose-neutral mt-8 max-w-none text-ink">
          {article.body.map((paragraph) => (
            <p key={paragraph} className="mb-4 leading-relaxed">{paragraph}</p>
          ))}
        </div>
        <section className="mt-10 rounded-surface border border-[var(--color-border-subtle)] bg-white p-5 text-sm text-muted">
          <h2 className="text-base font-semibold text-teal">Fontes</h2>
          <ul className="mt-2 list-disc pl-5">
            {article.sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </section>
      </article>
      <Footer />
    </div>
  );
}
