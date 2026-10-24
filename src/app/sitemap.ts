import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "/", lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: "/cadastro", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "/termos", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: "/privacidade", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
