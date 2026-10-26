import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { ensureClinicForAdmin } from "@/lib/server/clinic-team-service";
import { requireWorkspace } from "@/lib/server/require-workspace";

export async function GET(request: Request) {
  const ctx = await requireWorkspace(request);
  if ("error" in ctx) return ctx.error;
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });

  if (ctx.workspace.clinicId) {
    const snap = await db.collection("clinics").doc(ctx.workspace.clinicId).get();
    if (snap.exists) return NextResponse.json({ clinic: snap.data() });
  }

  if (ctx.workspace.kind === "owner") {
    const clinic = await ensureClinicForAdmin(ctx.auth.uid, "Minha clínica");
    return NextResponse.json({ clinic });
  }

  return NextResponse.json({ clinic: null });
}

export async function PATCH(request: Request) {
  const ctx = await requireWorkspace(request);
  if ("error" in ctx) return ctx.error;
  if (ctx.workspace.kind !== "owner" && ctx.workspace.clinicRole !== "admin") {
    return NextResponse.json({ reason: "proibido" }, { status: 403 });
  }
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  const body = await request.json();
  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  const clinic = await ensureClinicForAdmin(ctx.auth.uid, nome || "Minha clínica");
  if (nome) await db.collection("clinics").doc(clinic!.id).set({ nome }, { merge: true });
  return NextResponse.json({ clinic: { ...clinic, nome: nome || clinic?.nome } });
}
