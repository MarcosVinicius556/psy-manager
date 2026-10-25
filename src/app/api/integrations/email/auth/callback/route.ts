import { NextResponse } from "next/server";
import { emailOAuthRedirectUri } from "@/lib/email-integration/config";
import {
  exchangeCodeForTokens,
  fetchGoogleEmail,
  refreshGmailAccessToken,
  revokeRefreshToken,
} from "@/lib/email-integration/gmail-api";
import { verifyEmailOAuthState } from "@/lib/email-integration/oauth-state";
import {
  consumeOAuthNonce,
  decryptCredential,
  encryptCredential,
  markConnected,
  readEmailIntegration,
} from "@/lib/email-integration/store";

export const runtime = "nodejs";

function redirectAfterOAuth(origin: string, query: Record<string, string>) {
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

  const [body] = state.split(".");
  let uid = "";
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { uid?: string };
    uid = payload.uid || "";
  } catch {
    return redirectAfterOAuth(origin, { email: "erro", motivo: "state" });
  }

  if (oauthError) return redirectAfterOAuth(origin, { email: "erro", motivo: oauthError });
  if (!code || !state || !uid) return redirectAfterOAuth(origin, { email: "erro", motivo: "parametros" });

  const record = await readEmailIntegration(uid);
  if (!record?.oauthStateNonce) return redirectAfterOAuth(origin, { email: "erro", motivo: "nonce" });
  const verified = verifyEmailOAuthState(state, uid, record.oauthStateNonce);
  if (!verified.ok) return redirectAfterOAuth(origin, { email: "erro", motivo: verified.reason });

  const nonceOk = await consumeOAuthNonce(uid, record.oauthStateNonce);
  if (!nonceOk) return redirectAfterOAuth(origin, { email: "erro", motivo: "nonce" });

  const redirectUri = emailOAuthRedirectUri(origin);
  if (!redirectUri) return redirectAfterOAuth(origin, { email: "erro", motivo: "redirect" });

  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    if (!tokens.refresh_token) return redirectAfterOAuth(origin, { email: "erro", motivo: "refresh" });
    const accessToken =
      tokens.access_token || (await refreshGmailAccessToken(uid, tokens.refresh_token));
    const googleEmail = await fetchGoogleEmail(accessToken);
    if (!googleEmail) return redirectAfterOAuth(origin, { email: "erro", motivo: "email" });

    const previous = await readEmailIntegration(uid);
    if (previous?.provider === "gmail_oauth" && previous.refreshTokenEncrypted) {
      try {
        await revokeRefreshToken(decryptCredential(previous.refreshTokenEncrypted));
      } catch {
        // best effort
      }
    }

    await markConnected(uid, "gmail_oauth", googleEmail, {
      refreshTokenEncrypted: encryptCredential(tokens.refresh_token),
    });
    return redirectAfterOAuth(origin, { email: "conectado" });
  } catch {
    return redirectAfterOAuth(origin, { email: "erro", motivo: "troca" });
  }
}
