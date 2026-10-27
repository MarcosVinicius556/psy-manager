import { NextResponse } from "next/server";
import {
  loadPatientAccountLink,
  patientPortalActive,
  requirePatientSession,
} from "@/lib/server/patient-portal/auth";
import { getActiveConnection, listPatientConnections } from "@/lib/server/patient-portal/connections";
import { requireAuthUser } from "@/lib/server/require-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;

  const session = await requirePatientSession(request);
  if ("error" in session) {
    return NextResponse.json({ linked: false, registered: false, profileComplete: false });
  }

  const account = session.account;
  const profileComplete = account.profileComplete === true;
  const displayNome =
    typeof account.nome === "string" && account.nome.trim()
      ? account.nome.trim()
      : typeof auth.email === "string"
        ? auth.email.split("@")[0]
        : "";

  const connections = await listPatientConnections(session.db, session.uid);
  const hasConnection = connections.length > 0;
  const link = await loadPatientAccountLink(auth.uid);
  const activeConn = await getActiveConnection(session.db, auth.uid);

  if (!link?.ownerUid || !link.patientId || !activeConn || activeConn.status !== "ativa") {
    return NextResponse.json({
      linked: hasConnection,
      registered: true,
      profileComplete,
      active: false,
      patientNome: displayNome,
      email: link?.email || session.email,
      connectionsCount: connections.length,
    });
  }

  const active = await patientPortalActive(session.db, link.ownerUid, link.patientId);
  if (!active) {
    return NextResponse.json({
      linked: true,
      registered: true,
      profileComplete,
      active: false,
      reason: "portal_desativado",
      patientNome: displayNome,
      profissionalNome: activeConn.profissionalNome,
      email: link.email,
    });
  }

  const patientSnap = await session.db.collection("patients").doc(link.patientId).get();
  const recordNome = typeof patientSnap.data()?.nome === "string" ? patientSnap.data()!.nome : "";

  return NextResponse.json({
    linked: true,
    registered: true,
    profileComplete,
    active: true,
    patientNome: displayNome || recordNome,
    profissionalNome: activeConn.profissionalNome,
    email: link.email,
    activeConnectionId: activeConn.id,
  });
}
