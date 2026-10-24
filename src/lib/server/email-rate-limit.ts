import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 30;

const memory = new Map<string, { count: number; windowStart: number }>();

export async function enforceEmailRateLimit(uid: string) {
  const db = getAdminDb();
  if (!db) {
    const now = Date.now();
    const entry = memory.get(uid);
    if (!entry || now - entry.windowStart >= WINDOW_MS) {
      memory.set(uid, { count: 1, windowStart: now });
      return null;
    }
    if (entry.count >= MAX_PER_WINDOW) {
      return NextResponse.json({ error: "Limite de envios atingido. Tente novamente mais tarde." }, { status: 429 });
    }
    entry.count += 1;
    return null;
  }

  const ref = db.collection("apiEmailRateLimits").doc(uid);
  const now = Date.now();
  const snap = await ref.get();
  const data = snap.data();
  const windowStart = typeof data?.windowStart === "number" ? data.windowStart : 0;
  const count = typeof data?.count === "number" ? data.count : 0;
  if (!snap.exists || now - windowStart >= WINDOW_MS) {
    await ref.set({ windowStart: now, count: 1 });
    return null;
  }
  if (count >= MAX_PER_WINDOW) {
    return NextResponse.json({ error: "Limite de envios atingido. Tente novamente mais tarde." }, { status: 429 });
  }
  await ref.set({ windowStart, count: count + 1 });
  return null;
}
