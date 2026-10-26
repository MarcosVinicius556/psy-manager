import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { patientOwnedByUid } from "@/lib/server/clinic-access";
import { decryptFormResponses } from "@/lib/server/form-response-store";
import { requireAuthUser } from "@/lib/server/require-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const patientId = url.searchParams.get("patientId")?.trim() ?? "";
  if (!patientId) return NextResponse.json({ reason: "paciente_ausente" }, { status: 400 });
  if (!(await patientOwnedByUid(patientId, auth.uid))) {
    return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ reason: "firebase_admin" }, { status: 503 });

  const snapshot = await db.collection("formResponses").where("ownerUid", "==", auth.uid).limit(100).get();

  const items = snapshot.docs
    .filter((doc) => doc.data().patientId === patientId)
    .slice(0, 20)
    .map((doc) => {
    const data = doc.data();
      return {
        id: doc.id,
        templateId: typeof data.templateId === "string" ? data.templateId : "",
        templateVersion: Number(data.templateVersion) || 1,
        submittedAt: typeof data.submittedAt === "string" ? data.submittedAt : "",
        respostas: decryptFormResponses(data),
      };
    });

  return NextResponse.json({ items });
}
