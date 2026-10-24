/**
 * Canonical public site URL for metadata, sitemap and robots.
 * Prefer NEXT_PUBLIC_SITE_URL; fall back to Vercel host in preview/production.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    const withScheme = explicit.startsWith("http") ? explicit : `https://${explicit}`;
    return withScheme.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/\/$/, "");
    return host.startsWith("http") ? host.replace(/\/$/, "") : `https://${host}`;
  }
  return "https://www.psymanager.com.br";
}
