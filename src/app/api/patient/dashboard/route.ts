import { NextResponse } from "next/server";
import {
  listPatientAppointments,
  listPatientPendingDocuments,
  listPatientPaymentsWithPix,
} from "@/lib/server/patient-portal/data";
import { requirePatientAuth } from "@/lib/server/patient-portal/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requirePatientAuth(request);
  if ("error" in session) return session.error;

  const appointments = await listPatientAppointments(session.db, session.link);
  const upcoming = appointments.filter((item) => item.status === "agendado" || item.status === "em_andamento");
  const next = upcoming.sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))[0] || null;
  const pendingDocs = await listPatientPendingDocuments(session.db, session.link);
  const pendingPayments = await listPatientPaymentsWithPix(session.db, session.link);

  return NextResponse.json({
    nextSession: next,
    pendingDocuments: pendingDocs.length,
    pendingPayments: pendingPayments.length,
    cvvNote:
      "Este portal não é canal de emergência. Em crise, ligue 188 (CVV) ou procure o serviço de urgência mais próximo.",
  });
}
