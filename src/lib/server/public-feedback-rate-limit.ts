import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_POST_PER_IP = 20;
const MAX_POST_PER_TOKEN = 5;
const MAX_GET_PER_IP = 60;

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

  const ref = db.collection("apiPublicFeedbackRateLimits").doc(key);
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

export async function enforcePublicFeedbackGetRateLimit(ip: string) {
  return bumpLimit(`get:ip:${ip}`, MAX_GET_PER_IP);
}

export async function enforcePublicFeedbackPostRateLimit(ip: string, token: string) {
  const byIp = await bumpLimit(`post:ip:${ip}`, MAX_POST_PER_IP);
  if (byIp) return byIp;
  return bumpLimit(`post:token:${token}`, MAX_POST_PER_TOKEN);
}
