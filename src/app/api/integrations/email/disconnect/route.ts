import { NextResponse } from "next/server";
import { requireEmailUser } from "@/lib/email-integration/api-auth";
import { decryptCredential, deleteEmailIntegration, readEmailIntegration } from "@/lib/email-integration/store";
import { revokeRefreshToken } from "@/lib/email-integration/gmail-api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireEmailUser(request);
  if ("error" in auth) return auth.error;

  const record = await readEmailIntegration(auth.uid);
  if (record?.provider === "gmail_oauth" && record.refreshTokenEncrypted) {
    try {
      await revokeRefreshToken(decryptCredential(record.refreshTokenEncrypted));
    } catch {
      // best effort
    }
  }
  await deleteEmailIntegration(auth.uid);
  return NextResponse.json({ disconnected: true });
}
