import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_GET_PER_IP = 80;
const MAX_POST_PER_IP = 15;
const MAX_POST_PER_SLUG = 40;

const memory = new Map<string, { count: number; windowStart: number }>();

async function bumpLimit(key: string, max: number) {
  const db = getAdminDb();
  if (!db) {
    const now = Date.now();
    const entry = memory.get(key);
    if (!entry || now - entry.windowStart >= WINDOW_MS) {
      memory.set(key, { count: 1, windowStart: now });
      return null;
    }
    if (entry.count >= max) {
      return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
    }
    entry.count += 1;
    return null;
  }

  const ref = db.collection("apiPublicFeedbackRateLimits").doc(`booking:${key}`);
  const now = Date.now();
  const snap = await ref.get();
  const data = snap.data();
  const windowStart = typeof data?.windowStart === "number" ? data.windowStart : 0;
  const count = typeof data?.count === "number" ? data.count : 0;
  if (!snap.exists || now - windowStart >= WINDOW_MS) {
    await ref.set({ windowStart: now, count: 1 });
    return null;
  }
  if (count >= max) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  }
  await ref.set({ windowStart, count: count + 1 });
  return null;
}

export async function enforcePublicBookingGetRateLimit(ip: string) {
  return bumpLimit(`get:ip:${ip}`, MAX_GET_PER_IP);
}

export async function enforcePublicBookingPostRateLimit(ip: string, slug: string) {
  const byIp = await bumpLimit(`post:ip:${ip}`, MAX_POST_PER_IP);
  if (byIp) return byIp;
  return bumpLimit(`post:slug:${slug}`, MAX_POST_PER_SLUG);
}
