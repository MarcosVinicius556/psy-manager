import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/server/require-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { isSupportStaffUid, readUserRole } from "@/lib/support/roles";
import {
  getTicket,
  setBotPaused,
  setTicketAssignee,
  transitionTicketStatus,
  updateTicketClassification,
  updateTicketPriority,
} from "@/lib/support/store";
import { mapStoreError, readJson } from "@/lib/support/http";
import type { SupportClassification, SupportPriority, SupportTicketStatus } from "@/lib/support/types";

export const runtime = "nodejs";

type PatchBody = {
  priority?: SupportPriority;
  classification?: SupportClassification;
  status?: SupportTicketStatus;
  statusReason?: string;
  assignee?: { type: "human" | "bot"; uid?: string; name: string };
  pauseBot?: boolean;
  resumeBot?: boolean;
  expectedVersion?: number;
  githubMerged?: boolean;
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });
  if (!(await isSupportStaffUid(auth.uid))) return NextResponse.json({ reason: "proibido" }, { status: 403 });
  const { id } = await context.params;
  const ticket = await getTicket(id);
  if (!ticket) return NextResponse.json({ reason: "nao_encontrado" }, { status: 404 });
  const body = await readJson<PatchBody>(request);
  if (!body) return NextResponse.json({ reason: "dados_invalidos" }, { status: 400 });
  const actor = { uid: auth.uid, name: auth.email ?? "Atendente", role: await readUserRole(auth.uid) };
  try {
    if (body.priority) await updateTicketPriority(id, body.priority, actor);
    if (body.classification !== undefined) await updateTicketClassification(id, body.classification, actor);
    if (body.assignee) await setTicketAssignee(id, body.assignee, actor, true);
    if (body.pauseBot) await setBotPaused(id, true, actor);
    if (body.resumeBot) await setBotPaused(id, false, actor);
    if (body.status) {
      await transitionTicketStatus({
        ticketId: id,
        to: body.status,
        actor,
        reason: body.statusReason,
        githubMerged: body.githubMerged,
        expectedVersion: body.expectedVersion ?? ticket.version,
      });
    }
    const updated = await getTicket(id);
    return NextResponse.json({ ticket: updated });
  } catch (error) {
    return mapStoreError(error);
  }
}
