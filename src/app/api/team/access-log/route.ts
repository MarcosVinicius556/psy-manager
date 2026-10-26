import { NextResponse } from "next/server";
import { recordClinicalAccessLog } from "@/lib/team/clinical-access-log";
import { requireWorkspace, forbidUnlessStaffPerm } from "@/lib/server/require-workspace";

export async function POST(request: Request) {
  const ctx = await requireWorkspace(request);
  if ("error" in ctx) return ctx.error;
  const body = await request.json();
  const patientId = typeof body.patientId === "string" ? body.patientId.trim() : "";
  const area = body.area === "prontuario" ? "prontuario" : "paciente_admin";
  const actorNome = typeof body.actorNome === "string" ? body.actorNome : "";
  if (!patientId) return NextResponse.json({ error: "patientId obrigatório." }, { status: 400 });

  if (area === "prontuario" && !ctx.workspace.isClinicalAllowed) {
    return NextResponse.json({ reason: "proibido" }, { status: 403 });
  }
  if (ctx.workspace.kind === "secretaria") {
    const denied = forbidUnlessStaffPerm(ctx.workspace, area === "prontuario" ? "pacientes" : "pacientes");
    if (denied) return denied;
  }

  const actorRole =
    ctx.workspace.kind === "secretaria"
      ? "secretaria"
      : ctx.workspace.clinicRole === "admin"
        ? "clinica_admin"
        : "psicologo";

  await recordClinicalAccessLog({
    ownerUid: ctx.workspace.tenantOwnerUid,
    patientId,
    actorUid: ctx.auth.uid,
    actorNome: actorNome || ctx.auth.email || "Usuário",
    actorEmail: ctx.auth.email,
    actorRole,
    area,
  });

  return NextResponse.json({ success: true });
}
