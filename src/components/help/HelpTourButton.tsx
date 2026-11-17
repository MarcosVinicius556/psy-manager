"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { tourForPath, type TourStep } from "@/lib/help/tours";

function isVisible(element: Element) {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  const style = window.getComputedStyle(element);
  return style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0;
}

function resolveElement(step: TourStep): Element | null | undefined {
  if (!step.element) return undefined;
  const selectors = Array.isArray(step.element) ? step.element : [step.element];
  for (const selector of selectors) {
    const found = Array.from(document.querySelectorAll(selector)).find(isVisible);
    if (found) return found;
  }
  return null;
}

export function buildDriveSteps(steps: TourStep[]): DriveStep[] {
  const result: DriveStep[] = [];
  for (const step of steps) {
    const element = resolveElement(step);
    if (element === null) continue; // elemento não existe nesta tela: pula o passo
    result.push({
      ...(element ? { element } : {}),
      popover: {
        title: step.title,
        description: step.description,
        ...(step.side ? { side: step.side } : {}),
      },
    });
  }
  return result;
}

/**
 * Botão "?" que inicia o guia da página atual (driver.js).
 * `variant="header"`: dentro do cabeçalho (celular / portal do paciente).
 * `variant="floating"`: canto inferior direito no desktop (≥ 960px).
 */
export default function HelpTourButton({ variant = "floating" }: { variant?: "floating" | "header" }) {
  const pathname = usePathname() || "";
  const tour = tourForPath(pathname);
  const driverRef = useRef<Driver | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [pathname]);

  const start = useCallback(async () => {
    if (!tour) return;
    setStarting(true);
    try {
      const { driver } = await import("driver.js");
      const steps = buildDriveSteps(tour.steps);
      if (steps.length === 0) return;
      driverRef.current?.destroy();
      const instance = driver({
        steps,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        overlayOpacity: 0.45,
        stagePadding: 6,
        stageRadius: 8,
        popoverClass: "psy-tour-popover",
        showProgress: steps.length > 1,
        progressText: "{{current}} de {{total}}",
        nextBtnText: "Próximo",
        prevBtnText: "Voltar",
        doneBtnText: "Concluir",
        onDestroyed: () => {
          driverRef.current = null;
        },
      });
      driverRef.current = instance;
      instance.drive();
    } finally {
      setStarting(false);
    }
  }, [tour]);

  if (!tour) return null;

  const base = "psy-help-button btn-icon";
  const className =
    variant === "header"
      ? `${base} psy-help-button--header shrink-0`
      : `${base} psy-help-button--floating fixed bottom-6 right-6 z-40 hidden desk:inline-flex`;

  return (
    <button
      type="button"
      className={className}
      data-tour="help-button"
      aria-label={`Ajuda: guia da página ${tour.title}`}
      title="Ajuda: mostrar o guia desta página"
      disabled={starting}
      onClick={() => void start()}
    >
      <span aria-hidden className="text-base font-semibold leading-none">?</span>
    </button>
  );
}
