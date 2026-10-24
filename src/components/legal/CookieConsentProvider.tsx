"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import CookieBanner from "@/components/legal/CookieBanner";
import CookiePreferencesSheet from "@/components/legal/CookiePreferencesSheet";
import OptionalAnalytics from "@/components/legal/OptionalAnalytics";
import {
  consentAllows,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsentChoice,
} from "@/lib/legal/consent-storage";

type CookieConsentContextValue = {
  consent: CookieConsentChoice | null;
  ready: boolean;
  openPreferences: () => void;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (funcionais: boolean, analiticos: boolean) => void;
  allows: (category: "funcionais" | "analiticos") => boolean;
};

const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(undefined);

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent deve ser usado dentro de CookieConsentProvider");
  }
  return ctx;
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsentChoice | null>(null);
  const [ready, setReady] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const stored = readCookieConsent();
    setConsent(stored);
    setBannerOpen(!stored);
    setReady(true);
    function onUpdate() {
      const next = readCookieConsent();
      setConsent(next);
      setBannerOpen(!next);
    }
    window.addEventListener("psy-cookie-consent", onUpdate);
    return () => window.removeEventListener("psy-cookie-consent", onUpdate);
  }, []);

  const persist = useCallback((next: Omit<CookieConsentChoice, "updatedAt" | "necessarios" | "version">) => {
    const saved = writeCookieConsent(next);
    setConsent(saved);
    setBannerOpen(false);
    setSheetOpen(false);
  }, []);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      ready,
      openPreferences: () => {
        setSheetOpen(true);
        setBannerOpen(false);
      },
      acceptAll: () => persist({ funcionais: true, analiticos: true }),
      rejectNonEssential: () => persist({ funcionais: false, analiticos: false }),
      savePreferences: (funcionais, analiticos) => persist({ funcionais, analiticos }),
      allows: (category) => consentAllows(category, consent),
    }),
    [consent, persist, ready],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      <OptionalAnalytics />
      {ready && bannerOpen ? (
        <CookieBanner
          onAcceptAll={value.acceptAll}
          onReject={value.rejectNonEssential}
          onConfigure={() => {
            setSheetOpen(true);
            setBannerOpen(false);
          }}
        />
      ) : null}
      <CookiePreferencesSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        initialFuncionais={consent?.funcionais ?? false}
        initialAnaliticos={consent?.analiticos ?? false}
        onSave={value.savePreferences}
      />
    </CookieConsentContext.Provider>
  );
}
