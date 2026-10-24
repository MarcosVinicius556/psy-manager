import { NextResponse } from "next/server";
import { googleCalendarIntegrationAvailable } from "./config";
import { requireAuthUser } from "@/lib/server/require-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export async function requireGoogleUser(request: Request) {
  if (!googleCalendarIntegrationAvailable()) {
    return { error: NextResponse.json({ available: false, reason: "indisponivel" }, { status: 503 }) };
  }
  if (!getAdminDb()) {
    return { error: NextResponse.json({ available: false, reason: "firebase_admin" }, { status: 503 }) };
  }
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth;
  return { uid: auth.uid, email: auth.email };
}
