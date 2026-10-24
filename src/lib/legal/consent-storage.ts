import { COOKIE_CONSENT_VERSION } from "./config";

export type CookieCategory = "necessarios" | "funcionais" | "analiticos";

export type CookieConsentChoice = {
  version: string;
  necessarios: true;
  funcionais: boolean;
  analiticos: boolean;
  updatedAt: string;
};

const STORAGE_KEY = "psy-cookie-consent";

export function readCookieConsent(): CookieConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentChoice;
    if (parsed.version !== COOKIE_CONSENT_VERSION) return null;
    if (parsed.necessarios !== true) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCookieConsent(choice: Omit<CookieConsentChoice, "updatedAt" | "necessarios" | "version">) {
  const payload: CookieConsentChoice = {
    version: COOKIE_CONSENT_VERSION,
    necessarios: true,
    funcionais: choice.funcionais,
    analiticos: choice.analiticos,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("psy-cookie-consent", { detail: payload }));
  return payload;
}

export function consentAllows(category: CookieCategory, consent: CookieConsentChoice | null) {
  if (category === "necessarios") return true;
  if (!consent) return false;
  if (category === "funcionais") return consent.funcionais;
  return consent.analiticos;
}
