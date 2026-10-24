import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { locationOwnedByUid } from "@/lib/google-calendar/access";
import { requireGoogleUser } from "@/lib/google-calendar/api-auth";
import { GOOGLE_CALENDAR_SCOPES, googleOAuthRedirectUri } from "@/lib/google-calendar/config";
import { locationIntegrationKey, userIntegrationKey } from "@/lib/google-calendar/integration-keys";
import { createOAuthState } from "@/lib/google-calendar/oauth-state";
import { saveOAuthPendingNonce } from "@/lib/google-calendar/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireGoogleUser(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const locationId = url.searchParams.get("locationId")?.trim() || "";
  if (locationId) {
    const owner = await locationOwnedByUid(locationId, auth.uid);
    if (!owner) return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  }

  const integrationKey = locationId ? locationIntegrationKey(locationId) : userIntegrationKey(auth.uid);
  const origin = url.origin;
  const redirectUri = googleOAuthRedirectUri(origin);
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId || !redirectUri) {
    return NextResponse.json({ reason: "oauth_incompleto" }, { status: 503 });
  }

  const nonce = randomBytes(16).toString("hex");
  await saveOAuthPendingNonce(integrationKey, nonce);
  const state = createOAuthState(auth.uid, nonce, Date.now(), {
    integrationKey,
    locationId: locationId || undefined,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return NextResponse.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
}
