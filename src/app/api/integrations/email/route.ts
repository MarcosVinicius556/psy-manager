import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/server/require-auth";
import { readEmailIntegration, toPublicIntegration } from "@/lib/email-integration/store";
import { emailIntegrationAvailable } from "@/lib/email-integration/config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  const record = await readEmailIntegration(auth.uid);
  return NextResponse.json(toPublicIntegration(record));
}

export async function HEAD() {
  return NextResponse.json({ available: emailIntegrationAvailable() });
}
