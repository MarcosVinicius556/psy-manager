import { getAdminDb } from "@/lib/firebase-admin";

const COLLECTION = "emailAutomationMarkers";

export function paymentConfirmationMarkerId(paymentId: string) {
  return `payment_${paymentId}_confirmacao`;
}

export async function claimAutomationSend(markerId: string, ownerUid: string) {
  const db = getAdminDb();
  if (!db) return { claimed: false as const, reason: "firebase_admin" };
  const ref = db.collection(COLLECTION).doc(markerId);
  const existing = await ref.get();
  if (existing.exists) return { claimed: false as const, reason: "ja_enviado" };
  await ref.set({ ownerUid, createdAt: new Date().toISOString(), markerId });
  return { claimed: true as const };
}
