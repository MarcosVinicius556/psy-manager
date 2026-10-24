import type { User, UserCredential } from "firebase/auth";

const EMBEDDED_WEBVIEW_PATTERN = /FBAN|FBAV|Instagram|Line\/|Twitter|LinkedInApp|Snapchat|WhatsApp/i;

export function prefersGoogleRedirect() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (EMBEDDED_WEBVIEW_PATTERN.test(ua)) return true;
  return /\bwv\b/.test(ua) && /Android/i.test(ua);
}

export function googleSignInRouteKey() {
  return "psy-manager.google-signin-route";
}

export function rememberGoogleSignInRoute(eligible: boolean) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(googleSignInRouteKey(), eligible ? "/admin" : "/admin/assinatura");
}

export function consumeGoogleSignInRoute(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const route = sessionStorage.getItem(googleSignInRouteKey());
  if (route) sessionStorage.removeItem(googleSignInRouteKey());
  return route;
}

export function trialEligibleFromUserDoc(data: Record<string, unknown> | undefined) {
  if (!data) return true;
  return !(data.billingAccess === "restrito" && data.subscriptionStatus === "trial_expirado");
}

export function googleProfileFromCredential(credential: UserCredential) {
  return googleProfileFromUser(credential.user);
}

export function googleProfileFromUser(user: User) {
  const email = user.email?.trim().toLowerCase();
  if (!email) {
    throw new Error("A conta Google não informou um e-mail.");
  }
  return {
    uid: user.uid,
    email,
    nome: user.displayName || "",
    foto: user.photoURL || "",
  };
}
