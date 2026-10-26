import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuthUser } from "@/lib/server/require-auth";
import { rejectBookingRequest } from "@/lib/server/booking/approve-request";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAuthUser(request);
  if (auth.error) return auth.error;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "indisponivel" }, { status: 503 });

  const { id } = await context.params;
  const result = await rejectBookingRequest(db, auth.uid, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
