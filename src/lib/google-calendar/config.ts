export function googleOAuthConfigured() {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

export function googleTokenEncryptionConfigured() {
  return Boolean(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim());
}

export function googleCalendarIntegrationAvailable() {
  return googleOAuthConfigured() && googleTokenEncryptionConfigured() && Boolean(process.env.NEXT_PUBLIC_PROJECT_ID);
}

export function googleOAuthRedirectUri(requestOrigin?: string) {
  const fromEnv = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv;
  if (!requestOrigin) return "";
  return `${requestOrigin.replace(/\/$/, "")}/api/integrations/google-calendar/auth/callback`;
}

export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];
