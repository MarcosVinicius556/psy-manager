"use client";

import { useEffect, useState } from "react";
import { patientFetch } from "@/lib/patient/api";
import type { PatientPortalMotion, PatientPortalTheme } from "@/lib/server/patient-portal/types";

function applyTheme(theme: PatientPortalTheme) {
  const root = document.documentElement;
  if (theme === "escuro") {
    root.classList.add("patient-dark");
    root.style.colorScheme = "dark";
  } else if (theme === "claro") {
    root.classList.remove("patient-dark");
    root.style.colorScheme = "light";
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      root.classList.add("patient-dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("patient-dark");
      root.style.colorScheme = "light";
    }
  }
}

function applyMotion(motion: PatientPortalMotion) {
  const root = document.documentElement;
  if (motion === "reduzido") {
    root.classList.add("patient-reduce-motion");
  } else if (motion === "completo") {
    root.classList.remove("patient-reduce-motion");
  } else if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.add("patient-reduce-motion");
  } else {
    root.classList.remove("patient-reduce-motion");
  }
}

export function PatientPortalThemeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const prefs = await patientFetch("/api/patient/preferences");
        applyTheme(prefs.theme as PatientPortalTheme);
        applyMotion(prefs.motion as PatientPortalMotion);
      } catch {
        applyTheme("sistema");
        applyMotion("sistema");
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) return children;
  return children;
}

export function PatientAppearanceSettings() {
  const [theme, setTheme] = useState<PatientPortalTheme>("sistema");
  const [motion, setMotion] = useState<PatientPortalMotion>("sistema");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void patientFetch("/api/patient/preferences").then((prefs) => {
      setTheme(prefs.theme as PatientPortalTheme);
      setMotion(prefs.motion as PatientPortalMotion);
    });
  }, []);

  async function save(next: { theme?: PatientPortalTheme; motion?: PatientPortalMotion }) {
    setSaving(true);
    try {
      const data = await patientFetch("/api/patient/preferences", {
        method: "PATCH",
        body: JSON.stringify(next),
      });
      const prefs = data.portalPrefs || next;
      if (prefs.theme) {
        setTheme(prefs.theme as PatientPortalTheme);
        applyTheme(prefs.theme as PatientPortalTheme);
      }
      if (prefs.motion) {
        setMotion(prefs.motion as PatientPortalMotion);
        applyMotion(prefs.motion as PatientPortalMotion);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4">
      <h2 className="mb-3 font-medium text-teal">Aparência</h2>
      <div className="space-y-4 text-sm">
        <div>
          <p className="mb-2 text-muted">Cor</p>
          <div className="flex flex-wrap gap-2">
            {(["sistema", "claro", "escuro"] as PatientPortalTheme[]).map((item) => (
              <button
                key={item}
                type="button"
                className={`btn-chip ${theme === item ? "border-teal text-teal" : ""}`}
                onClick={() => void save({ theme: item })}
                disabled={saving}
              >
                {item === "sistema" ? "Sistema" : item === "claro" ? "Claro" : "Escuro"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-muted">Movimento</p>
          <div className="flex flex-wrap gap-2">
            {(["sistema", "completo", "reduzido"] as PatientPortalMotion[]).map((item) => (
              <button
                key={item}
                type="button"
                className={`btn-chip ${motion === item ? "border-teal text-teal" : ""}`}
                onClick={() => void save({ motion: item })}
                disabled={saving}
              >
                {item === "sistema" ? "Sistema" : item === "completo" ? "Completo" : "Reduzido"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
