import { MetadataRoute } from "next";
import { ARTICLES } from "@/content/articles";
import { getSiteUrl } from "@/lib/site";

const paths: MetadataRoute.Sitemap = [
  { url: "/", changeFrequency: "monthly", priority: 1 },
  { url: "/planos", changeFrequency: "weekly", priority: 0.9 },
  { url: "/conteudos", changeFrequency: "weekly", priority: 0.7 },
  { url: "/cadastro", changeFrequency: "monthly", priority: 0.8 },
  { url: "/termos", changeFrequency: "yearly", priority: 0.3 },
  { url: "/privacidade", changeFrequency: "yearly", priority: 0.3 },
  { url: "/cookies", changeFrequency: "yearly", priority: 0.3 },
  { url: "/seguranca", changeFrequency: "yearly", priority: 0.3 },
  { url: "/suboperadores", changeFrequency: "yearly", priority: 0.3 },
  { url: "/dpa", changeFrequency: "yearly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();
  const staticEntries = paths.map((entry) => ({
    ...entry,
    url: `${base}${entry.url}`,
    lastModified,
  }));
  const articles = ARTICLES.map((article) => ({
    url: `${base}/conteudos/${article.slug}`,
    lastModified: new Date(article.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...staticEntries, ...articles];
}
