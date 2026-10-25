import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const WINDOW_MS = 15 * 60 * 1000;
const memory = new Map<string, { count: number; windowStart: number }>();

async function bump(key: string, max: number) {
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
  const ref = db.collection("apiSupportRateLimits").doc(key);
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

export async function enforceSupportTicketCreateLimit(uid: string) {
  return bump(`create:${uid}`, 5);
}

export async function enforceSupportMessageLimit(uid: string) {
  return bump(`msg:${uid}`, 30);
}

export async function enforceSupportBotLimit(ip: string) {
  return bump(`bot:${ip}`, 120);
}
