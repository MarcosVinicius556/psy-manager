import { NextResponse } from "next/server";
import { memberUidForProfessionalId } from "@/lib/google-calendar/access";
import { requireGoogleUser } from "@/lib/google-calendar/api-auth";
import { googleBusyConflicts } from "@/lib/google-calendar/busy-conflict";
import { googleBusyBlocksForScheduling } from "@/lib/google-calendar/busy-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireGoogleUser(request);
  if ("error" in auth) return auth.error;
  const body = (await request.json()) as {
    professionalId?: string | null;
    date?: string;
    startTime?: string;
    endTime?: string;
  };
  const professionalId = body.professionalId || null;
  const date = typeof body.date === "string" ? body.date : "";
  const startTime = typeof body.startTime === "string" ? body.startTime : "";
  const endTime = typeof body.endTime === "string" ? body.endTime : "";
  if (!date || !startTime || !endTime) {
    return NextResponse.json({ conflict: false, reason: "dados_invalidos" }, { status: 400 });
  }

  const professionalUid = await memberUidForProfessionalId(professionalId);
  if (!professionalUid) {
    return NextResponse.json({ conflict: false });
  }

  const blocks = await googleBusyBlocksForScheduling(professionalUid, date, date);
  const conflict = googleBusyConflicts(blocks, { date, startTime, endTime });
  return NextResponse.json({ conflict });
}
