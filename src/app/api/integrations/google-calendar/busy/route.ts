import { NextResponse } from "next/server";
import { requireGoogleUser } from "@/lib/google-calendar/api-auth";
import { fetchFreeBusy, getValidAccessToken } from "@/lib/google-calendar/google-api";
import { readIntegration } from "@/lib/google-calendar/store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireGoogleUser(request);
  if ("error" in auth) return auth.error;
  const record = await readIntegration(auth.uid);
  if (!record?.refreshTokenEncrypted || !record.syncFromGoogle || !record.calendarId) {
    return NextResponse.json({ blocks: [] });
  }
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ reason: "intervalo_invalido" }, { status: 400 });
  }
  const accessToken = await getValidAccessToken(auth.uid);
  const busy = await fetchFreeBusy(accessToken, record.calendarId, `${from}T00:00:00-03:00`, `${to}T23:59:59-03:00`);
  const blocks = busy.map((item) => ({
    date: item.start.slice(0, 10),
    startTime: item.start.includes("T") ? item.start.split("T")[1]?.slice(0, 5) || "00:00" : "00:00",
    endTime: item.end.includes("T") ? item.end.split("T")[1]?.slice(0, 5) || "23:59" : "23:59",
  }));
  return NextResponse.json({ blocks });
}
