import { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

const paths: MetadataRoute.Sitemap = [
  { url: "/", changeFrequency: "monthly", priority: 1 },
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
  return paths.map((entry) => ({
    ...entry,
    url: `${base}${entry.url}`,
    lastModified,
  }));
}
