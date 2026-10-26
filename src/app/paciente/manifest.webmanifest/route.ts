import { NextResponse } from "next/server";

export function GET() {
  const manifest = {
    name: "Psy Manager — Paciente",
    short_name: "Paciente",
    description: "Portal do paciente: sessões, Pix, diário e escalas.",
    start_url: "/paciente",
    scope: "/paciente",
    display: "standalone",
    background_color: "#f4f7f4",
    theme_color: "#3d5240",
    lang: "pt-BR",
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
  return NextResponse.json(manifest);
}
