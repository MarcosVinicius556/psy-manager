import { getAdminDb } from "@/lib/firebase-admin";
import type { EmailLogStatus } from "./types";

export async function writeEmailLog(input: {
  ownerUid: string;
  to: string;
  templateId: string | null;
  templateNome: string | null;
  subject: string;
  status: EmailLogStatus;
  error: string | null;
  patientId?: string | null;
  paymentId?: string | null;
  relatedType?: string | null;
  relatedId?: string | null;
}) {
  const db = getAdminDb();
  if (!db) return null;
  const sentAt = new Date().toISOString();
  const ref = await db.collection("emailLog").add({
    ownerUid: input.ownerUid,
    to: input.to,
    templateId: input.templateId,
    templateNome: input.templateNome,
    subject: input.subject,
    status: input.status,
    error: input.error,
    sentAt,
    patientId: input.patientId || null,
    paymentId: input.paymentId || null,
    relatedType: input.relatedType || null,
    relatedId: input.relatedId || null,
  });
  return ref.id;
}
