import { NextResponse } from "next/server";
import { googleOAuthRedirectUri } from "@/lib/google-calendar/config";
import { exchangeCodeForTokens, fetchGoogleEmail, refreshAccessToken } from "@/lib/google-calendar/google-api";
import { verifyOAuthState } from "@/lib/google-calendar/oauth-state";
import { consumeOAuthNonce, encryptRefreshToken, readIntegration, writeIntegration } from "@/lib/google-calendar/store";

export const runtime = "nodejs";

function settingsRedirect(origin: string, query: Record<string, string>) {
  const url = new URL("/admin/configuracoes", origin);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";
  const oauthError = url.searchParams.get("error");

  if (oauthError) return settingsRedirect(origin, { google: "erro", motivo: oauthError });
  if (!code || !state) return settingsRedirect(origin, { google: "erro", motivo: "parametros" });

  const [body] = state.split(".");
  let uid = "";
  let nonce = "";
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { uid?: string; nonce?: string };
    uid = payload.uid || "";
    nonce = payload.nonce || "";
  } catch {
    return settingsRedirect(origin, { google: "erro", motivo: "state" });
  }
  if (!uid || !nonce) return settingsRedirect(origin, { google: "erro", motivo: "state" });

  const record = await readIntegration(uid);
  if (!record?.oauthStateNonce) return settingsRedirect(origin, { google: "erro", motivo: "nonce" });
  const verified = verifyOAuthState(state, uid, record.oauthStateNonce);
  if (!verified.ok) return settingsRedirect(origin, { google: "erro", motivo: verified.reason });

  const nonceOk = await consumeOAuthNonce(uid, record.oauthStateNonce);
  if (!nonceOk) return settingsRedirect(origin, { google: "erro", motivo: "nonce" });

  const redirectUri = googleOAuthRedirectUri(origin);
  if (!redirectUri) return settingsRedirect(origin, { google: "erro", motivo: "redirect" });

  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    if (!tokens.refresh_token) return settingsRedirect(origin, { google: "erro", motivo: "refresh" });
    const accessToken = tokens.access_token || await refreshAccessToken(uid, tokens.refresh_token);
    const googleEmail = await fetchGoogleEmail(accessToken);
    await writeIntegration(uid, {
      refreshTokenEncrypted: encryptRefreshToken(tokens.refresh_token),
      googleEmail,
      calendarId: null,
      calendarSummary: null,
      syncToGoogle: false,
      syncFromGoogle: false,
      eventTitleMode: "generic",
      connectedAt: new Date().toISOString(),
      oauthStateNonce: "",
    });
    return settingsRedirect(origin, { google: "conectado" });
  } catch {
    return settingsRedirect(origin, { google: "erro", motivo: "troca" });
  }
}
