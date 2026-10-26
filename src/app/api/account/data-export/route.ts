import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { buildAccountExportZipBytes } from "@/lib/server/account-data-export";
import { requirePsychologistPortalClinicalActor } from "@/lib/server/patient-portal/psychologist-access";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gate = await requirePsychologistPortalClinicalActor(request);
  if ("error" in gate) return gate.error;

  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });

  const zipped = await buildAccountExportZipBytes(db, gate.ownerUid);
  return new NextResponse(zipped, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Cache-Control": "no-store",
    },
  });
}
