import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuthUser } from "@/lib/server/require-auth";
import {
  emailIntegrationAvailable,
  emailIntegrationUnavailabilityReason,
  emailOAuthAvailable,
  emailSmtpAvailable,
} from "./config";

function unavailableResponse() {
  console.warn("[email-integration] unavailable:", emailIntegrationUnavailabilityReason());
  return { error: NextResponse.json({ available: false, reason: "indisponivel" }, { status: 503 }) };
}

export async function requireEmailUser(request: Request) {
  if (!emailIntegrationAvailable()) {
    return unavailableResponse();
  }
  if (!getAdminDb()) {
    console.warn("[email-integration] Firebase Admin SDK not configured");
    return { error: NextResponse.json({ available: false, reason: "firebase_admin" }, { status: 503 }) };
  }
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth;
  return { uid: auth.uid, email: auth.email };
}

export async function requireEmailOAuthUser(request: Request) {
  if (!emailOAuthAvailable()) {
    console.warn("[email-integration] OAuth unavailable:", emailIntegrationUnavailabilityReason());
    return { error: NextResponse.json({ available: false, reason: "oauth_indisponivel" }, { status: 503 }) };
  }
  return requireEmailUser(request);
}

export async function requireEmailSmtpUser(request: Request) {
  if (!emailSmtpAvailable()) {
    return unavailableResponse();
  }
  return requireEmailUser(request);
}
