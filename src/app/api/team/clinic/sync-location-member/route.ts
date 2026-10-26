import { NextResponse } from "next/server";
import { readLocation, syncClinicMemberForLocation } from "@/lib/server/clinic-location-service";
import { requireAuthUser } from "@/lib/server/require-auth";

export async function POST(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  const body = await request.json();
  const locationId = typeof body.locationId === "string" ? body.locationId.trim() : "";
  const memberUid = typeof body.memberUid === "string" ? body.memberUid.trim() : auth.uid;
  if (!locationId) return NextResponse.json({ error: "Local obrigatório." }, { status: 400 });

  const location = await readLocation(locationId);
  if (!location) return NextResponse.json({ reason: "local_inexistente" }, { status: 404 });
  const isOwner = location.createdByUid === auth.uid;
  const isSelf = memberUid === auth.uid;
  if (!isOwner && !isSelf) return NextResponse.json({ reason: "proibido" }, { status: 403 });

  await syncClinicMemberForLocation(locationId, memberUid);
  return NextResponse.json({ success: true });
}
