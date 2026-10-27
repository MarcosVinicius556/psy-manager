import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_IP = 30;
const MAX_PER_UID = 15;

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
      return NextResponse.json({ reason: "limite_tentativas" }, { status: 429 });
    }
    entry.count += 1;
    return null;
  }

  const ref = db.collection("apiPatientLinkCodeRateLimits").doc(key);
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
    return NextResponse.json({ reason: "limite_tentativas" }, { status: 429 });
  }
  await ref.set({ windowStart, count: count + 1 });
  return null;
}

export async function enforceLinkCodeRedeemRateLimit(ip: string, uid: string) {
  const byIp = await bumpLimit(`redeem:ip:${ip}`, MAX_PER_IP);
  if (byIp) return byIp;
  return bumpLimit(`redeem:uid:${uid}`, MAX_PER_UID);
}
