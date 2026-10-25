import { googleOAuthConfigured } from "@/lib/google-calendar/config";
import { emailCredentialsEncryptionConfigured } from "./encryption";

export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

export const EMAIL_OAUTH_SCOPES = [
  GMAIL_SEND_SCOPE,
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
];

export function emailPlatformConfigured() {
  return emailCredentialsEncryptionConfigured() && Boolean(process.env.NEXT_PUBLIC_PROJECT_ID);
}

/** Gmail OAuth connect flow (needs Google client + encryption + Firebase project id). */
export function emailOAuthAvailable() {
  return googleOAuthConfigured() && emailPlatformConfigured();
}

/** Gmail SMTP app-password flow (encryption + Firebase project id; OAuth not required). */
export function emailSmtpAvailable() {
  return emailPlatformConfigured();
}

/** Any email integration mode the professional can use. */
export function emailIntegrationAvailable() {
  return emailOAuthAvailable() || emailSmtpAvailable();
}

export function emailIntegrationUnavailabilityReason(): string {
  if (emailIntegrationAvailable()) return "";
  const missing: string[] = [];
  if (!emailCredentialsEncryptionConfigured()) missing.push("EMAIL_CREDENTIALS_ENC_KEY");
  if (!process.env.NEXT_PUBLIC_PROJECT_ID) missing.push("NEXT_PUBLIC_PROJECT_ID");
  if (!emailOAuthAvailable() && !emailSmtpAvailable()) {
    if (!googleOAuthConfigured()) missing.push("GOOGLE_OAUTH_CLIENT_ID/GOOGLE_OAUTH_CLIENT_SECRET (for OAuth only)");
  }
  return missing.length ? `Missing: ${missing.join(", ")}` : "unknown";
}

export function emailOAuthRedirectUri(requestOrigin?: string) {
  const fromEnv = process.env.EMAIL_OAUTH_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv;
  if (!requestOrigin) return "";
  return `${requestOrigin.replace(/\/$/, "")}/api/integrations/email/auth/callback`;
}
