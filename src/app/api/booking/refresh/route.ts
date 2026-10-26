import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuthUser } from "@/lib/server/require-auth";
import { refreshBookingAvailabilityForOwner } from "@/lib/server/booking/refresh-availability";

export async function POST(request: Request) {
  const auth = await requireAuthUser(request);
  if (auth.error) return auth.error;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "indisponivel" }, { status: 503 });

  const result = await refreshBookingAvailabilityForOwner(db, auth.uid);
  return NextResponse.json(result);
}
