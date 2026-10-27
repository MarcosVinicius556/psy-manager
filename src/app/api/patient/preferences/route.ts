import { NextResponse } from "next/server";
import { requirePatientSession } from "@/lib/server/patient-portal/auth";
import type { PatientPortalMotion, PatientPortalTheme } from "@/lib/server/patient-portal/types";

export const runtime = "nodejs";

const THEMES: PatientPortalTheme[] = ["sistema", "claro", "escuro"];
const MOTIONS: PatientPortalMotion[] = ["sistema", "completo", "reduzido"];

export async function GET(request: Request) {
  const session = await requirePatientSession(request);
  if ("error" in session) return session.error;
  const userSnap = await session.db.collection("users").doc(session.uid).get();
  const prefs = userSnap.data()?.portalPrefs || {};
  return NextResponse.json({
    theme: THEMES.includes(prefs.theme) ? prefs.theme : "sistema",
    motion: MOTIONS.includes(prefs.motion) ? prefs.motion : "sistema",
  });
}

export async function PATCH(request: Request) {
  const session = await requirePatientSession(request);
  if ("error" in session) return session.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ reason: "corpo_invalido" }, { status: 400 });
  }
  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const theme = typeof payload.theme === "string" ? payload.theme : "";
  const motion = typeof payload.motion === "string" ? payload.motion : "";
  const portalPrefs: Record<string, string> = {};
  if (THEMES.includes(theme as PatientPortalTheme)) portalPrefs.theme = theme;
  if (MOTIONS.includes(motion as PatientPortalMotion)) portalPrefs.motion = motion;
  if (!Object.keys(portalPrefs).length) return NextResponse.json({ reason: "prefs_invalidas" }, { status: 400 });

  const now = new Date().toISOString();
  await session.db.collection("users").doc(session.uid).set({ portalPrefs, updatedAt: now }, { merge: true });
  return NextResponse.json({ ok: true, portalPrefs });
}
