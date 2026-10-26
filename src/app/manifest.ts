import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Psy Manager",
    short_name: "Psy Manager",
    description: "Agenda e gestão do consultório de psicologia.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#f4f7f4",
    theme_color: "#3d5240",
    lang: "pt-BR",
    orientation: "portrait-primary",
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
