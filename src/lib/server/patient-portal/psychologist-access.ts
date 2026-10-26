import { NextResponse } from "next/server";
import { patientOwnedByUid } from "@/lib/server/clinic-access";
import { requireWorkspace } from "@/lib/server/require-workspace";

async function psychologistPortalClinicalWorkspace(request: Request) {
  const ctx = await requireWorkspace(request);
  if ("error" in ctx) return { error: ctx.error };
  if (!ctx.workspace.isClinicalAllowed || ctx.workspace.kind === "secretaria") {
    return { error: NextResponse.json({ reason: "proibido" }, { status: 403 }) };
  }
  if (ctx.workspace.actorUid !== ctx.workspace.tenantOwnerUid) {
    return { error: NextResponse.json({ reason: "proibido" }, { status: 403 }) };
  }
  return { ownerUid: ctx.workspace.tenantOwnerUid };
}

/** Diário, escalas e demais dados clínicos do portal — só o titular (nunca secretária/clínica admin). */
export async function requirePsychologistPortalClinical(request: Request, patientId: string) {
  const gate = await psychologistPortalClinicalWorkspace(request);
  if ("error" in gate) return gate;
  if (!(await patientOwnedByUid(patientId, gate.ownerUid))) {
    return { error: NextResponse.json({ reason: "sem_permissao" }, { status: 403 }) };
  }
  return { ownerUid: gate.ownerUid };
}

export async function requirePsychologistPortalClinicalActor(request: Request) {
  return psychologistPortalClinicalWorkspace(request);
}
