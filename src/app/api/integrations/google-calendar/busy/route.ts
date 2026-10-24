import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { locationSharedWithUid } from "@/lib/google-calendar/access";
import { requireGoogleUser } from "@/lib/google-calendar/api-auth";
import { busyBlocksForUid } from "@/lib/google-calendar/busy-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireGoogleUser(request);
  if ("error" in auth) return auth.error;
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const locationId = url.searchParams.get("locationId") || "";
  if (!from || !to) {
    return NextResponse.json({ reason: "intervalo_invalido" }, { status: 400 });
  }

  const viewerUid = auth.uid;
  const subjectUids = new Set<string>([viewerUid]);

  if (locationId) {
    const shared = await locationSharedWithUid(locationId, viewerUid);
    if (!shared) {
      return NextResponse.json({ reason: "sem_permissao" }, { status: 403 });
    }
    const db = getAdminDb();
    if (db) {
      const snap = await db.collection("locations").doc(locationId).get();
      const memberUids = (snap.data()?.memberUids as string[]) || [];
      for (const uid of memberUids) subjectUids.add(uid);
    }
  }

  const blocks = [];
  for (const subjectUid of subjectUids) {
    const items = await busyBlocksForUid(subjectUid, viewerUid, from, to);
    blocks.push(...items);
  }

  return NextResponse.json({ blocks });
}
