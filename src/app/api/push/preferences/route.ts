import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { normalizePushPrefs } from "@/lib/server/web-push";
import { requireAuthUser } from "@/lib/server/require-auth";

export async function POST(request: Request) {
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

  const prefs = normalizePushPrefs(body);
  await db.collection("users").doc(auth.uid).set({ pushPrefs: prefs, pushPrefsUpdatedAt: new Date().toISOString() }, { merge: true });
  return NextResponse.json({ ok: true, prefs });
}
