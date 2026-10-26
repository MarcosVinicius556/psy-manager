import { NextResponse } from "next/server";
import { DEFAULT_PATIENT_PUSH_PREFS, normalizePatientPushPrefs } from "@/lib/server/patient-portal/push";
import { requirePatientAuth } from "@/lib/server/patient-portal/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requirePatientAuth(request);
  if ("error" in session) return session.error;
  const userSnap = await session.db.collection("users").doc(session.uid).get();
  return NextResponse.json({ prefs: normalizePatientPushPrefs(userSnap.data()?.pushPrefs) });
}

export async function PATCH(request: Request) {
  const session = await requirePatientAuth(request);
  if ("error" in session) return session.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reason: "corpo_invalido" }, { status: 400 });
  }
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const currentSnap = await session.db.collection("users").doc(session.uid).get();
  const current = normalizePatientPushPrefs(currentSnap.data()?.pushPrefs);
  const next = {
    ...DEFAULT_PATIENT_PUSH_PREFS,
    ...current,
    ...(payload.prefs && typeof payload.prefs === "object" ? normalizePatientPushPrefs(payload.prefs) : {}),
  };
  await session.db.collection("users").doc(session.uid).set({ pushPrefs: next, updatedAt: new Date().toISOString() }, { merge: true });
  return NextResponse.json({ prefs: next });
}
