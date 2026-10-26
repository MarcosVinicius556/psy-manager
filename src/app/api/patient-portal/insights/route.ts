import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { patientOwnedByUid } from "@/lib/server/clinic-access";
import { psychologistInsights } from "@/lib/server/patient-portal/data";
import { requireAuthUser } from "@/lib/server/require-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  const patientId = new URL(request.url).searchParams.get("patientId")?.trim() || "";
  if (!patientId) return NextResponse.json({ reason: "patientId_obrigatorio" }, { status: 400 });
  if (!(await patientOwnedByUid(patientId, auth.uid))) {
    return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  }
  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });
  const insights = await psychologistInsights(db, auth.uid, patientId);
  return NextResponse.json(insights);
}
