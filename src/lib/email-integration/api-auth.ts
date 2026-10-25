import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuthUser } from "@/lib/server/require-auth";
import { emailIntegrationAvailable } from "./config";

export async function requireEmailUser(request: Request) {
  if (!emailIntegrationAvailable()) {
    return { error: NextResponse.json({ available: false, reason: "indisponivel" }, { status: 503 }) };
  }
  if (!getAdminDb()) {
    return { error: NextResponse.json({ available: false, reason: "firebase_admin" }, { status: 503 }) };
  }
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth;
  return { uid: auth.uid, email: auth.email };
}
