import { NextResponse } from "next/server";
import { locationOwnedByUid } from "@/lib/google-calendar/access";
import { requireGoogleUser } from "@/lib/google-calendar/api-auth";
import { locationIntegrationKey, userIntegrationKey } from "@/lib/google-calendar/integration-keys";
import { getValidAccessToken, listCalendars } from "@/lib/google-calendar/google-api";
import { readIntegration } from "@/lib/google-calendar/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireGoogleUser(request);
  if ("error" in auth) return auth.error;
  const locationId = new URL(request.url).searchParams.get("locationId")?.trim() || "";
  let key = userIntegrationKey(auth.uid);
  if (locationId) {
    const owner = await locationOwnedByUid(locationId, auth.uid);
    if (!owner) return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
    key = locationIntegrationKey(locationId);
  }
  const record = await readIntegration(key);
  if (!record?.refreshTokenEncrypted) {
    return NextResponse.json({ reason: "nao_conectado" }, { status: 400 });
  }
  const accessToken = await getValidAccessToken(key);
  const calendars = await listCalendars(accessToken);
  return NextResponse.json({ calendars });
}
