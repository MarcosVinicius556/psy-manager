import { NextResponse } from "next/server";
import { revokeStaffAccess } from "@/lib/server/staff-service";
import { requireWorkspace } from "@/lib/server/require-workspace";

export async function POST(request: Request) {
  const ctx = await requireWorkspace(request);
  if ("error" in ctx) return ctx.error;
  if (ctx.workspace.kind !== "owner") {
    return NextResponse.json({ reason: "proibido" }, { status: 403 });
  }
  const body = await request.json();
  const staffUid = typeof body.staffUid === "string" ? body.staffUid.trim() : "";
  if (!staffUid) return NextResponse.json({ error: "staffUid obrigatório." }, { status: 400 });
  const ok = await revokeStaffAccess(ctx.auth.uid, staffUid);
  if (!ok) return NextResponse.json({ error: "Membro não encontrado." }, { status: 404 });
  return NextResponse.json({ success: true });
}
