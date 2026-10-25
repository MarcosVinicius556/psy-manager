import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export type SupportNoticeKind =
  | "ticket_opened_admin"
  | "ticket_message"
  | "ticket_status"
  | "ticket_priority"
  | "ticket_info_requested"
  | "ticket_analysis_started"
  | "ticket_analysis_finished"
  | "ticket_issue_created"
  | "ticket_pr_opened"
  | "ticket_pr_updated"
  | "ticket_approval_requested"
  | "ticket_rejected"
  | "ticket_new_version"
  | "ticket_resolved"
  | "ticket_closed"
  | "ticket_bot_failed";

export function supportNotificationId(ticketId: string, eventId: string) {
  return `support_${ticketId}_${eventId}`;
}

type NoticeInput = {
  uid: string;
  ticketId: string;
  eventId: string;
  kind: SupportNoticeKind;
  titulo: string;
  corpo: string;
  href?: string;
};

export async function deliverSupportInboxNotice(input: NoticeInput) {
  const db = getAdminDb();
  if (!db) return;
  const messageId = supportNotificationId(input.ticketId, input.eventId);
  const ref = db.collection("users").doc(input.uid).collection("inbox").doc(messageId);
  const existing = await ref.get();
  if (existing.exists) return;
  await ref.set({
    kind: input.kind,
    categoria: "suporte",
    titulo: input.titulo.slice(0, 200),
    corpo: input.corpo.slice(0, 4000),
    ticketId: input.ticketId,
    href: input.href ?? `/admin/suporte/${input.ticketId}`,
    lida: false,
    criadoEm: new Date().toISOString(),
  });
}

export async function notifyAdminsOfTicket(
  db: Firestore,
  ticketId: string,
  eventId: string,
  titulo: string,
  corpo: string
) {
  const admins = await db.collection("users").where("role", "in", ["super_admin", "support"]).get();
  await Promise.all(
    admins.docs.map((doc) =>
      deliverSupportInboxNotice({
        uid: doc.id,
        ticketId,
        eventId,
        kind: "ticket_opened_admin",
        titulo,
        corpo,
        href: `/plataforma/suporte/${ticketId}`,
      })
    )
  );
}
