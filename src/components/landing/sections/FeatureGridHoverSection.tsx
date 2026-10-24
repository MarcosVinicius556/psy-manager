"use client";

import { useCallback, useState } from "react";
import { PatientsMock } from "@/components/landing/Mockups";
import SectionLabel from "@/components/landing/ui/SectionLabel";

const tiles = [
  { id: "agenda", label: "Agenda", tint: "bg-[#e7f0e5]" },
  { id: "pacientes", label: "Pacientes", tint: "bg-[#f6e6df]" },
  { id: "financeiro", label: "Financeiro", tint: "bg-[#dfe8f0]" },
  { id: "prontuario", label: "Prontuário", tint: "bg-[#eef3ee]" },
];

export default function FeatureGridHoverSection() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top, visible: true });
  }, []);

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="site-container">
        <SectionLabel>Visão geral</SectionLabel>
        <h2 className="landing-display mt-4 max-w-xl text-[clamp(1.85rem,1.1rem+2.6vw,3rem)] leading-[1.08] tracking-[-0.03em]">
          Passe o mouse e veja o módulo em destaque
        </h2>
        <p className="mt-3 max-w-lg text-sm text-muted sm:hidden">Toque em um card para destacar.</p>

        <div
          className="landing-hover-grid relative mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
          onMouseMove={onMove}
          onMouseLeave={() => {
            setHovered(null);
            setCursor((c) => ({ ...c, visible: false }));
          }}
        >
          {tiles.map((tile) => {
            const dim = hovered !== null && hovered !== tile.id;
            return (
              <button
                type="button"
                key={tile.id}
                className={`relative aspect-[3/4] overflow-hidden rounded-[20px] border border-[#e8e4dc] transition-[opacity,transform] duration-300 ${
                  dim ? "opacity-40 sm:opacity-35" : "opacity-100"
                } ${tile.tint}`}
                onMouseEnter={() => setHovered(tile.id)}
                onFocus={() => setHovered(tile.id)}
                onClick={() => setHovered(tile.id)}
              >
                <span className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink shadow-sm">
                  {tile.label}
                </span>
                {tile.id === "pacientes" && (
                  <div className="absolute inset-0 scale-[0.55] origin-top-left opacity-90">
                    <PatientsMock />
                  </div>
                )}
                {tile.id !== "pacientes" && (
                  <div className="flex h-full items-end p-4">
                    <p className="text-sm font-medium text-ink/70">Mockup do painel</p>
                  </div>
                )}
              </button>
            );
          })}

          <span
            className="landing-cursor-pill pointer-events-none absolute z-20 hidden translate-x-2 translate-y-2 sm:block"
            style={{
              left: cursor.x,
              top: cursor.y,
              opacity: cursor.visible && hovered ? 1 : 0,
            }}
            aria-hidden
          >
            {hovered ? tiles.find((t) => t.id === hovered)?.label : ""}
          </span>
        </div>
      </div>
    </section>
  );
}
