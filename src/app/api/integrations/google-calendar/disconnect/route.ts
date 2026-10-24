import { NextResponse } from "next/server";
import { locationOwnedByUid } from "@/lib/google-calendar/access";
import { requireGoogleUser } from "@/lib/google-calendar/api-auth";
import { locationIntegrationKey, userIntegrationKey } from "@/lib/google-calendar/integration-keys";
import { revokeRefreshToken } from "@/lib/google-calendar/google-api";
import { decryptRefreshToken, deleteIntegration, readIntegration } from "@/lib/google-calendar/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireGoogleUser(request);
  if ("error" in auth) return auth.error;
  const body = (await request.json().catch(() => ({}))) as { locationId?: string };
  const locationId = typeof body.locationId === "string" ? body.locationId.trim() : "";
  let key = userIntegrationKey(auth.uid);
  if (locationId) {
    const owner = await locationOwnedByUid(locationId, auth.uid);
    if (!owner) return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
    key = locationIntegrationKey(locationId);
  }
  const record = await readIntegration(key);
  if (record?.refreshTokenEncrypted) {
    try {
      const refresh = decryptRefreshToken(record.refreshTokenEncrypted);
      await revokeRefreshToken(refresh);
    } catch {
      // continue
    }
  }
  await deleteIntegration(key);
  return NextResponse.json({ ok: true });
}
