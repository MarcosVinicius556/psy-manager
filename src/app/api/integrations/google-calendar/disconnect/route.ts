import { NextResponse } from "next/server";
import { requireGoogleUser } from "@/lib/google-calendar/api-auth";
import { revokeRefreshToken } from "@/lib/google-calendar/google-api";
import { decryptRefreshToken, deleteIntegration, readIntegration } from "@/lib/google-calendar/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireGoogleUser(request);
  if ("error" in auth) return auth.error;
  const record = await readIntegration(auth.uid);
  if (record?.refreshTokenEncrypted) {
    try {
      const refresh = decryptRefreshToken(record.refreshTokenEncrypted);
      await revokeRefreshToken(refresh);
    } catch {
      // continue deleting local credentials
    }
  }
  await deleteIntegration(auth.uid);
  return NextResponse.json({ ok: true });
}
