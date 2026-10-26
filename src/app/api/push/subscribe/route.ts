import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getVapidPublicKey } from "@/lib/server/web-push";
import { requireAuthUser } from "@/lib/server/require-auth";

function deviceIdFromEndpoint(endpoint: string) {
  return createHash("sha256").update(endpoint).digest("hex").slice(0, 32);
}

export async function GET() {
  const publicKey = getVapidPublicKey();
  return NextResponse.json({ configured: Boolean(publicKey), publicKey });
}

export async function POST(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  if (!getVapidPublicKey()) {
    return NextResponse.json({ reason: "push_indisponivel" }, { status: 503 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reason: "corpo_invalido" }, { status: 400 });
  }
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const subscription = payload.subscription;
  const endpoint =
    subscription && typeof subscription === "object" && typeof (subscription as { endpoint?: string }).endpoint === "string"
      ? (subscription as { endpoint: string }).endpoint.trim()
      : "";
  if (!endpoint) return NextResponse.json({ reason: "subscription_invalida" }, { status: 400 });

  const plataforma = payload.plataforma === "ios" ? "ios" : "android";
  const deviceId = deviceIdFromEndpoint(endpoint);
  const now = new Date().toISOString();

  await db
    .collection("pushTokens")
    .doc(auth.uid)
    .collection("devices")
    .doc(deviceId)
    .set({
      ownerUid: auth.uid,
      subscription,
      plataforma,
      ultimoUso: now,
      createdAt: now,
    });

  return NextResponse.json({ ok: true, deviceId });
}

export async function DELETE(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reason: "corpo_invalido" }, { status: 400 });
  }
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const endpoint = typeof payload.endpoint === "string" ? payload.endpoint.trim() : "";
  if (!endpoint) return NextResponse.json({ reason: "endpoint_obrigatorio" }, { status: 400 });

  const deviceId = deviceIdFromEndpoint(endpoint);
  await db.collection("pushTokens").doc(auth.uid).collection("devices").doc(deviceId).delete();
  return NextResponse.json({ ok: true });
}
