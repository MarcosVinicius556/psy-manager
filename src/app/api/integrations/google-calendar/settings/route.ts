import { NextResponse } from "next/server";
import { requireGoogleUser } from "@/lib/google-calendar/api-auth";
import { readIntegration, toPublicSettings, updateSettings } from "@/lib/google-calendar/store";
import type { GoogleCalendarEventTitleMode } from "@/lib/google-calendar/types";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const auth = await requireGoogleUser(request);
  if ("error" in auth) return auth.error;
  const record = await readIntegration(auth.uid);
  if (!record?.refreshTokenEncrypted) {
    return NextResponse.json({ reason: "nao_conectado" }, { status: 400 });
  }
  const body = (await request.json()) as {
    calendarId?: string | null;
    calendarSummary?: string | null;
    syncToGoogle?: boolean;
    syncFromGoogle?: boolean;
    eventTitleMode?: GoogleCalendarEventTitleMode;
  };
  const patch: Parameters<typeof updateSettings>[1] = {};
  if (typeof body.calendarId === "string" || body.calendarId === null) patch.calendarId = body.calendarId;
  if (typeof body.calendarSummary === "string" || body.calendarSummary === null) patch.calendarSummary = body.calendarSummary;
  if (typeof body.syncToGoogle === "boolean") patch.syncToGoogle = body.syncToGoogle;
  if (typeof body.syncFromGoogle === "boolean") patch.syncFromGoogle = body.syncFromGoogle;
  if (body.eventTitleMode === "generic" || body.eventTitleMode === "first_name") patch.eventTitleMode = body.eventTitleMode;
  await updateSettings(auth.uid, patch);
  const next = await readIntegration(auth.uid);
  return NextResponse.json({ settings: toPublicSettings(next) });
}
