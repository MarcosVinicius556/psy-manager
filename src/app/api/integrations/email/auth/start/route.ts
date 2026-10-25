import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { EMAIL_OAUTH_SCOPES, emailOAuthRedirectUri } from "@/lib/email-integration/config";
import { createEmailOAuthState } from "@/lib/email-integration/oauth-state";
import { saveOAuthPendingNonce } from "@/lib/email-integration/store";
import { requireEmailUser } from "@/lib/email-integration/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireEmailUser(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const origin = url.origin;
  const redirectUri = emailOAuthRedirectUri(origin);
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId || !redirectUri) {
    return NextResponse.json({ reason: "oauth_incompleto" }, { status: 503 });
  }

  const nonce = randomBytes(16).toString("hex");
  await saveOAuthPendingNonce(auth.uid, nonce);
  const state = createEmailOAuthState(auth.uid, nonce);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: EMAIL_OAUTH_SCOPES.join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });

  return NextResponse.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
}
