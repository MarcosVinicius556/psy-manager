import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuthUser } from "@/lib/server/require-auth";
import type { BookingRequest } from "@/lib/booking/types";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapRequest(id: string, data: FirebaseFirestore.DocumentData): BookingRequest {
  return {
    id,
    ownerUid: text(data.ownerUid),
    slug: text(data.slug),
    status: (text(data.status) || "pendente") as BookingRequest["status"],
    patientName: text(data.patientName),
    patientEmail: text(data.patientEmail),
    patientPhone: text(data.patientPhone),
    modality: text(data.modality) === "presencial" ? "presencial" : "online",
    date: text(data.date),
    startTime: text(data.startTime),
    endTime: text(data.endTime),
    consentimentoEm: text(data.consentimentoEm),
    createdAtMillis: Number(data.createdAtMillis) || 0,
    appointmentId: text(data.appointmentId) || null,
    patientId: text(data.patientId) || null,
  };
}

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if (auth.error) return auth.error;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "indisponivel" }, { status: 503 });

  const status = new URL(request.url).searchParams.get("status") || "pendente";
  const snap = await db.collection("bookingRequests").where("ownerUid", "==", auth.uid).get();
  const items = snap.docs
    .map((doc) => mapRequest(doc.id, doc.data()))
    .filter((item) => (status === "all" ? true : item.status === status))
    .sort((a, b) => b.createdAtMillis - a.createdAtMillis);

  return NextResponse.json({ requests: items });
}
