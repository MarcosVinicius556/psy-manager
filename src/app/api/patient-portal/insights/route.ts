import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { psychologistInsights } from "@/lib/server/patient-portal/data";
import { requirePsychologistPortalClinical } from "@/lib/server/patient-portal/psychologist-access";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const patientId = new URL(request.url).searchParams.get("patientId")?.trim() || "";
  if (!patientId) return NextResponse.json({ reason: "patientId_obrigatorio" }, { status: 400 });
  const gate = await requirePsychologistPortalClinical(request, patientId);
  if ("error" in gate) return gate.error;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });
  const insights = await psychologistInsights(db, gate.ownerUid, patientId);
  return NextResponse.json(insights);
}
