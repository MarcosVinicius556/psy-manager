import { NextResponse } from "next/server";
import { locationOwnedByUid, locationSharedWithUid } from "@/lib/google-calendar/access";
import { requireGoogleUser } from "@/lib/google-calendar/api-auth";
import { googleCalendarIntegrationAvailable } from "@/lib/google-calendar/config";
import { locationIntegrationKey } from "@/lib/google-calendar/integration-keys";
import { readIntegration, toPublicSettings, updateSettings } from "@/lib/google-calendar/store";
import type { GoogleCalendarEventTitleMode } from "@/lib/google-calendar/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ locationId: string }> };

export async function GET(request: Request, { params }: Params) {
  const { locationId } = await params;
  const available = googleCalendarIntegrationAvailable();
  if (!available) {
    return NextResponse.json({ available: false, settings: toPublicSettings(null, "location", locationId) });
  }
  const auth = await requireGoogleUser(request);
  if ("error" in auth) return auth.error;
  const canRead = await locationSharedWithUid(locationId, auth.uid);
  if (!canRead) return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  const record = await readIntegration(locationIntegrationKey(locationId));
  const owner = await locationOwnedByUid(locationId, auth.uid);
  return NextResponse.json({
    available: true,
    owner,
    settings: toPublicSettings(record, "location", locationId),
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const { locationId } = await params;
  const auth = await requireGoogleUser(request);
  if ("error" in auth) return auth.error;
  const owner = await locationOwnedByUid(locationId, auth.uid);
  if (!owner) return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  const key = locationIntegrationKey(locationId);
  const record = await readIntegration(key);
  if (!record?.refreshTokenEncrypted) {
    return NextResponse.json({ reason: "nao_conectado" }, { status: 400 });
  }
  const body = (await request.json()) as {
    calendarId?: string | null;
    calendarSummary?: string | null;
    syncToGoogle?: boolean;
    eventTitleMode?: GoogleCalendarEventTitleMode;
  };
  const patch: Parameters<typeof updateSettings>[1] = {};
  if (typeof body.calendarId === "string" || body.calendarId === null) patch.calendarId = body.calendarId;
  if (typeof body.calendarSummary === "string" || body.calendarSummary === null) patch.calendarSummary = body.calendarSummary;
  if (typeof body.syncToGoogle === "boolean") patch.syncToGoogle = body.syncToGoogle;
  if (body.eventTitleMode === "generic" || body.eventTitleMode === "first_name") patch.eventTitleMode = body.eventTitleMode;
  await updateSettings(key, patch);
  const next = await readIntegration(key);
  return NextResponse.json({ settings: toPublicSettings(next, "location", locationId) });
}
