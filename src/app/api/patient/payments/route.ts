import { NextResponse } from "next/server";
import { listPatientPaymentsWithPix } from "@/lib/server/patient-portal/data";
import { requirePatientAuth } from "@/lib/server/patient-portal/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requirePatientAuth(request);
  if ("error" in session) return session.error;
  const items = await listPatientPaymentsWithPix(session.db, session.link);
  return NextResponse.json({ items });
}
