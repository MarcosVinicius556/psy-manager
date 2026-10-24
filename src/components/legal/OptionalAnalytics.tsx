"use client";

import { useEffect } from "react";
import { useCookieConsent } from "@/components/legal/CookieConsentProvider";

/** Carrega Firebase Analytics somente após consentimento analítico. */
export default function OptionalAnalytics() {
  const { ready, allows } = useCookieConsent();
  const measurementId = process.env.NEXT_PUBLIC_MEASUREMENT_ID?.trim();

  useEffect(() => {
    if (!ready || !measurementId || !allows("analiticos")) return;
    let cancelled = false;
    (async () => {
      const { getApps, initializeApp } = await import("firebase/app");
      const { getAnalytics, isSupported } = await import("firebase/analytics");
      if (cancelled) return;
      const supported = await isSupported();
      if (!supported || cancelled) return;
      const config = {
        apiKey: process.env.NEXT_PUBLIC_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_MESSAGE_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_APP_ID,
        measurementId,
      };
      const app = getApps()[0] ?? initializeApp(config);
      getAnalytics(app);
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [allows, measurementId, ready]);

  return null;
}
