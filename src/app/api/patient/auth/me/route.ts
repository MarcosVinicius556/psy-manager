import { NextResponse } from "next/server";
import { loadPatientAccountLink, requirePatientAuth } from "@/lib/server/patient-portal/auth";
import { requireAuthUser } from "@/lib/server/require-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  const link = await loadPatientAccountLink(auth.uid);
  if (!link) return NextResponse.json({ linked: false });

  const session = await requirePatientAuth(request);
  if ("error" in session) {
    return NextResponse.json({ linked: true, active: false, reason: "portal_desativado" });
  }

  const patientSnap = await session.db.collection("patients").doc(link.patientId).get();
  const nome = typeof patientSnap.data()?.nome === "string" ? patientSnap.data()!.nome : "";
  const memberSnap = await session.db.collection("members").doc(link.ownerUid).get();
  const profissional = typeof memberSnap.data()?.nome === "string" ? memberSnap.data()!.nome : "Profissional";

  return NextResponse.json({
    linked: true,
    active: true,
    patientNome: nome,
    profissionalNome: profissional,
    email: link.email,
  });
}
