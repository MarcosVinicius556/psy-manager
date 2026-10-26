import { ARTICLES } from "@/content/articles";
import { getSiteUrl } from "@/lib/site";

export function GET() {
  const base = getSiteUrl();
  const items = ARTICLES
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .map(
      (article) => `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${base}/conteudos/${article.slug}</link>
      <guid isPermaLink="true">${base}/conteudos/${article.slug}</guid>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(article.description)}</description>
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Psy Manager — Conteúdos</title>
    <link>${base}/conteudos</link>
    <description>Artigos sobre gestão do consultório, LGPD e CFP.</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
