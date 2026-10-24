import { NextResponse } from "next/server";
import { requireGoogleUser } from "@/lib/google-calendar/api-auth";
import { getValidAccessToken, listCalendars } from "@/lib/google-calendar/google-api";
import { readIntegration } from "@/lib/google-calendar/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireGoogleUser(request);
  if ("error" in auth) return auth.error;
  const record = await readIntegration(auth.uid);
  if (!record?.refreshTokenEncrypted) {
    return NextResponse.json({ reason: "nao_conectado" }, { status: 400 });
  }
  const accessToken = await getValidAccessToken(auth.uid);
  const calendars = await listCalendars(accessToken);
  return NextResponse.json({ calendars });
}
