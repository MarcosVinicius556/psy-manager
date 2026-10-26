import { NextResponse } from "next/server";
import { brasiliaDateYmd } from "@/lib/server/brasilia-time";
import { listJournalEntries, upsertJournalEntry } from "@/lib/server/patient-portal/data";
import { requirePatientAuth } from "@/lib/server/patient-portal/auth";
import type { Mood } from "@/lib/admin/types";

export const runtime = "nodejs";

const MOODS: Mood[] = ["calma", "ansioso", "triste", "irritado", "estavel"];

export async function GET(request: Request) {
  const session = await requirePatientAuth(request);
  if ("error" in session) return session.error;
  const items = await listJournalEntries(session.db, session.link, false);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await requirePatientAuth(request);
  if ("error" in session) return session.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reason: "corpo_invalido" }, { status: 400 });
  }
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const dia = typeof payload.dia === "string" && payload.dia.trim() ? payload.dia.trim() : brasiliaDateYmd();
  const humorRaw = typeof payload.humor === "string" ? payload.humor : "";
  const humor = MOODS.includes(humorRaw as Mood) ? (humorRaw as Mood) : "";
  const texto = typeof payload.texto === "string" ? payload.texto : "";
  const compartilhado = payload.compartilhado === true;

  const id = await upsertJournalEntry(session.db, session.link, { dia, humor, texto, compartilhado });
  return NextResponse.json({ ok: true, id });
}
