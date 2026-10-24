import { NextResponse } from "next/server";
import { googleCalendarIntegrationAvailable } from "./config";
import { bearerToken, verifyFirebaseIdToken } from "@/lib/server/verify-id-token";
import { getAdminDb } from "@/lib/firebase-admin";

export async function requireGoogleUser(request: Request) {
  if (!googleCalendarIntegrationAvailable()) {
    return { error: NextResponse.json({ available: false, reason: "indisponivel" }, { status: 503 }) };
  }
  if (!getAdminDb()) {
    return { error: NextResponse.json({ available: false, reason: "firebase_admin" }, { status: 503 }) };
  }
  const idToken = bearerToken(request);
  if (!idToken) {
    return { error: NextResponse.json({ reason: "nao_autorizado" }, { status: 401 }) };
  }
  const identity = await verifyFirebaseIdToken(idToken);
  if (!identity) {
    return { error: NextResponse.json({ reason: "nao_autorizado" }, { status: 401 }) };
  }
  return { uid: identity.uid, email: identity.email };
}
