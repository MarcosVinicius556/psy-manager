import type { Firestore } from "firebase-admin/firestore";
import { renewalNoticesDue, subscriptionStatusAfterExpiry } from "@/lib/billing/subscription-pix";
import { mapAccount } from "@/lib/saas/account-store";
import { renewalNoticeContent } from "@/lib/saas/model";
import { sendOperationalEmail } from "./operational-mail";

const BATCH = 200;

export async function runBillingRenewalsCron(db: Firestore, now = Date.now(), cursor: string | null = null) {
  let query = db.collection("users").where("role", "==", "psicologo").orderBy("__name__").limit(BATCH);
  if (cursor) {
    const cursorSnap = await db.collection("users").doc(cursor).get();
    if (cursorSnap.exists) query = query.startAfter(cursorSnap);
  }

  const snapshot = await query.get();
  let processed = 0;
  let noticesCreated = 0;
  let statusUpdates = 0;
  let emailsDelivered = 0;
  let lastId: string | null = null;

  for (const docSnap of snapshot.docs) {
    lastId = docSnap.id;
    const account = mapAccount(docSnap.id, docSnap.data());
    if (account.billingAccess !== "integral") continue;
    if (!account.paidUntilMillis) continue;

    processed += 1;

    const nextStatus = subscriptionStatusAfterExpiry(account.paidUntilMillis, now, account.subscriptionStatus);
    if (nextStatus && nextStatus !== account.subscriptionStatus) {
      await docSnap.ref.set(
        { subscriptionStatus: nextStatus, updatedAt: new Date(now).toISOString() },
        { merge: true }
      );
      statusUpdates += 1;
    }

    const inboxSnap = await docSnap.ref.collection("inbox").get();
    const existingIds = inboxSnap.docs.map((item) => item.id);
    const due = renewalNoticesDue(account, now, existingIds);
    for (const kind of due) {
      const content = renewalNoticeContent(kind, account);
      const inboxRef = docSnap.ref.collection("inbox").doc(kind);
      const current = await inboxRef.get();
      if (!current.exists) {
        await inboxRef.set({
          kind,
          categoria: content.categoria,
          titulo: content.titulo,
          corpo: content.corpo,
          lida: false,
          emailResult: "pendente",
          createdAt: new Date(now).toISOString(),
        });
        noticesCreated += 1;
      }
      if (account.operationalEmail && account.email) {
        const delivery = await sendOperationalEmail({
          to: account.email,
          subject: content.titulo,
          text: content.corpo,
        });
        if (delivery.delivered) emailsDelivered += 1;
        await inboxRef.set({ emailResult: delivery.delivered ? "enviado" : delivery.reason }, { merge: true });
      }
    }
  }

  const partial = snapshot.size >= BATCH;
  return {
    processed,
    noticesCreated,
    statusUpdates,
    emailsDelivered,
    cursor: partial && lastId ? lastId : null,
  };
}
