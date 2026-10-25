import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/server/require-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { canReviewTicket, readUserRole } from "@/lib/support/roles";
import { getTicket, submitTicketReview } from "@/lib/support/store";
import { mapStoreError, readJson } from "@/lib/support/http";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });
  const role = await readUserRole(auth.uid);
  const { id } = await context.params;
  const ticket = await getTicket(id);
  if (!ticket) return NextResponse.json({ reason: "nao_encontrado" }, { status: 404 });
  const isReviewer = canReviewTicket(role) || ticket.openedBy.uid === auth.uid;
  if (!isReviewer) return NextResponse.json({ reason: "proibido" }, { status: 403 });
  const body = await readJson<{ decision?: "approved" | "rejected"; reason?: string }>(request);
  if (body?.decision !== "approved" && body?.decision !== "rejected") {
    return NextResponse.json({ reason: "decisao_invalida" }, { status: 400 });
  }
  if (body.decision === "rejected" && !body.reason?.trim()) {
    return NextResponse.json({ reason: "motivo_obrigatorio" }, { status: 400 });
  }
  try {
    await submitTicketReview(id, body.decision, { uid: auth.uid, name: auth.email ?? "Revisor", role }, body.reason);
    const updated = await getTicket(id);
    return NextResponse.json({ ticket: updated });
  } catch (error) {
    return mapStoreError(error);
  }
}
