import { NextResponse } from "next/server";
import { googleCalendarIntegrationAvailable } from "@/lib/google-calendar/config";
import { readIntegration, toPublicSettings } from "@/lib/google-calendar/store";
import { requireGoogleUser } from "@/lib/google-calendar/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const available = googleCalendarIntegrationAvailable();
  if (!available) {
    return NextResponse.json({ available: false, settings: toPublicSettings(null) });
  }
  const auth = await requireGoogleUser(request);
  if ("error" in auth && auth.error) {
    if (auth.error.status === 503) return NextResponse.json({ available: false, settings: toPublicSettings(null) });
    return auth.error;
  }
  if (!("uid" in auth)) {
    return NextResponse.json({ available: false, settings: toPublicSettings(null) });
  }
  const record = await readIntegration(auth.uid);
  return NextResponse.json({ available: true, settings: toPublicSettings(record) });
}
