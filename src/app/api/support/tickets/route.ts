import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/server/require-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { enforceSupportTicketCreateLimit } from "@/lib/server/support-rate-limit";
import { createSupportTicket, listTicketsForUser } from "@/lib/support/store";
import { mapStoreError, readJson } from "@/lib/support/http";
import { validateAttachmentMeta } from "@/lib/support/attachments";
import type { SupportAttachmentMeta } from "@/lib/support/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });
  try {
    const tickets = await listTicketsForUser(auth.uid);
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("support.tickets.list", error);
    return NextResponse.json({ reason: "erro_listagem" }, { status: 500 });
  }
}

type CreateBody = {
  title?: string;
  description?: string;
  extraInfo?: string;
  impact?: string;
  attachments?: SupportAttachmentMeta[];
  openedByName?: string;
};

export async function POST(request: Request) {
  const auth = await requireAuthUser(request);
  if ("error" in auth) return auth.error;
  if (!getAdminDb()) return NextResponse.json({ reason: "indisponivel" }, { status: 503 });
  const limited = await enforceSupportTicketCreateLimit(auth.uid);
  if (limited) return limited;
  const body = await readJson<CreateBody>(request);
  if (!body?.title?.trim() || !body.description?.trim()) {
    return NextResponse.json({ reason: "dados_invalidos" }, { status: 400 });
  }
  const attachments = body.attachments ?? [];
  for (const att of attachments) {
    const err = validateAttachmentMeta(att);
    if (err) return NextResponse.json({ reason: "anexo_invalido", detail: err }, { status: 400 });
  }
  try {
    const result = await createSupportTicket({
      title: body.title,
      description: body.description,
      extraInfo: body.extraInfo ?? "",
      impact: body.impact ?? "",
      openedBy: {
        uid: auth.uid,
        name: body.openedByName?.trim() || auth.email || "Usuário",
        email: auth.email ?? "",
        clinicId: auth.uid,
      },
      attachments,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return mapStoreError(error);
  }
}
