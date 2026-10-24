import { NextResponse } from "next/server";
import { googleOAuthRedirectUri } from "@/lib/google-calendar/config";
import { exchangeCodeForTokens, fetchGoogleEmail, refreshAccessToken } from "@/lib/google-calendar/google-api";
import { verifyOAuthState } from "@/lib/google-calendar/oauth-state";
import { consumeOAuthNonce, encryptRefreshToken, readIntegration, writeIntegration } from "@/lib/google-calendar/store";

export const runtime = "nodejs";

function redirectAfterOAuth(origin: string, locationId: string | null, query: Record<string, string>) {
  const path = locationId ? `/admin/locais/${locationId}` : "/admin/configuracoes";
  const url = new URL(path, origin);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";
  const oauthError = url.searchParams.get("error");

  const [body] = state.split(".");
  let uid = "";
  let integrationKey = "";
  let locationId: string | null = null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      uid?: string;
      integrationKey?: string;
      locationId?: string;
    };
    uid = payload.uid || "";
    integrationKey = payload.integrationKey || payload.uid || "";
    locationId = payload.locationId || null;
  } catch {
    return redirectAfterOAuth(origin, null, { google: "erro", motivo: "state" });
  }

  if (oauthError) return redirectAfterOAuth(origin, locationId, { google: "erro", motivo: oauthError });
  if (!code || !state || !uid || !integrationKey) {
    return redirectAfterOAuth(origin, locationId, { google: "erro", motivo: "parametros" });
  }

  const record = await readIntegration(integrationKey);
  if (!record?.oauthStateNonce) return redirectAfterOAuth(origin, locationId, { google: "erro", motivo: "nonce" });
  const verified = verifyOAuthState(state, uid, record.oauthStateNonce);
  if (!verified.ok) return redirectAfterOAuth(origin, locationId, { google: "erro", motivo: verified.reason });

  const nonceOk = await consumeOAuthNonce(integrationKey, record.oauthStateNonce);
  if (!nonceOk) return redirectAfterOAuth(origin, locationId, { google: "erro", motivo: "nonce" });

  const redirectUri = googleOAuthRedirectUri(origin);
  if (!redirectUri) return redirectAfterOAuth(origin, locationId, { google: "erro", motivo: "redirect" });

  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    if (!tokens.refresh_token) return redirectAfterOAuth(origin, locationId, { google: "erro", motivo: "refresh" });
    const accessToken = tokens.access_token || (await refreshAccessToken(integrationKey, tokens.refresh_token));
    const googleEmail = await fetchGoogleEmail(accessToken);
    const isLocation = Boolean(locationId);
    await writeIntegration(integrationKey, {
      kind: isLocation ? "location" : "user",
      locationId: isLocation ? locationId : null,
      ownerUid: uid,
      refreshTokenEncrypted: encryptRefreshToken(tokens.refresh_token),
      googleEmail,
      calendarId: null,
      calendarSummary: null,
      syncToGoogle: false,
      syncFromGoogle: false,
      blockGoogleBusy: false,
      showGoogleEventTitles: false,
      eventTitleMode: "generic",
      connectedAt: new Date().toISOString(),
      oauthStateNonce: "",
    });
    return redirectAfterOAuth(origin, locationId, { google: "conectado" });
  } catch {
    return redirectAfterOAuth(origin, locationId, { google: "erro", motivo: "troca" });
  }
}
