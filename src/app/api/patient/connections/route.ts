import { NextResponse } from "next/server";
import { requirePatientSession } from "@/lib/server/patient-portal/auth";
import { getActiveConnection, listPatientConnections } from "@/lib/server/patient-portal/connections";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requirePatientSession(request);
  if ("error" in session) return session.error;

  const connections = await listPatientConnections(session.db, session.uid);
  const active = await getActiveConnection(session.db, session.uid);

  return NextResponse.json({
    connections,
    activeConnectionId: active?.id || null,
  });
}
