import { googleOAuthConfigured } from "@/lib/google-calendar/config";
import { emailCredentialsEncryptionConfigured } from "./encryption";

export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

export const EMAIL_OAUTH_SCOPES = [
  GMAIL_SEND_SCOPE,
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
];

export function emailOAuthRedirectUri(requestOrigin?: string) {
  const fromEnv = process.env.EMAIL_OAUTH_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv;
  if (!requestOrigin) return "";
  return `${requestOrigin.replace(/\/$/, "")}/api/integrations/email/auth/callback`;
}

export function emailIntegrationAvailable() {
  return (
    googleOAuthConfigured() &&
    emailCredentialsEncryptionConfigured() &&
    Boolean(process.env.NEXT_PUBLIC_PROJECT_ID)
  );
}
