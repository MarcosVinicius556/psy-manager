export type FirebaseTokenIdentity = {
  uid: string;
  email: string;
  emailVerified: boolean;
  signInProvider: string;
};

export function signInProviderFromClaims(claims: Record<string, unknown>): string {
  const firebase = claims.firebase;
  if (firebase && typeof firebase === "object") {
    const provider = (firebase as Record<string, unknown>).sign_in_provider;
    if (typeof provider === "string") return provider;
  }
  return "";
}

export function identityFromDecodedToken(decoded: {
  uid: string;
  email?: string;
  email_verified?: boolean;
  firebase?: { sign_in_provider?: string };
}): FirebaseTokenIdentity {
  const provider =
    typeof decoded.firebase?.sign_in_provider === "string" ? decoded.firebase.sign_in_provider : "";
  return {
    uid: decoded.uid,
    email: decoded.email?.toLowerCase() || "",
    emailVerified: decoded.email_verified === true,
    signInProvider: provider,
  };
}

/** E-mail do token pode ser usado para vínculo automático por correspondência. */
export function isVerifiedForEmailLinking(identity: FirebaseTokenIdentity): boolean {
  if (!identity.email) return false;
  if (identity.signInProvider === "google.com" || identity.signInProvider === "emailLink") {
    return true;
  }
  return identity.emailVerified === true;
}
