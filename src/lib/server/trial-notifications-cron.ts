import type { Firestore } from "firebase-admin/firestore";
import { noticeContent, noticesDue, type NoticeKind } from "@/lib/saas/model";
import { mapAccount } from "@/lib/saas/account-store";
import { sendOperationalEmail } from "./operational-mail";

export type TrialCronResult = {
  scanned: number;
  noticesCreated: number;
  emailsAttempted: number;
  emailsDelivered: number;
  skipped: number;
};

function markerId(uid: string, kind: NoticeKind) {
  return `${uid}_${kind}`;
}

export async function runTrialNotificationsCron(db: Firestore, now = Date.now()): Promise<TrialCronResult> {
  const result: TrialCronResult = {
    scanned: 0,
    noticesCreated: 0,
    emailsAttempted: 0,
    emailsDelivered: 0,
    skipped: 0,
  };

  const snapshot = await db
    .collection("users")
    .where("role", "==", "psicologo")
    .get();

  for (const docSnap of snapshot.docs) {
    const account = mapAccount(docSnap.id, docSnap.data());
    if (account.role === "super_admin") continue;
    const tracked =
      account.billingAccess === "trial" ||
      account.subscriptionStatus === "trial_ativo" ||
      account.subscriptionStatus === "trial_expirado";
    if (!tracked) continue;

    result.scanned += 1;
    const markerSnapshot = await db.collection("trialNoticeMarkers").where("accountId", "==", account.uid).get();
    const existingIds = [
      ...markerSnapshot.docs.map((item) => item.data().kind as string),
      ...(await db.collection("users").doc(account.uid).collection("inbox").get()).docs.map((item) => item.id),
    ];
    const due = noticesDue(account, now, existingIds);
    if (due.length === 0) {
      result.skipped += 1;
      continue;
    }

    for (const kind of due) {
      const markerRef = db.collection("trialNoticeMarkers").doc(markerId(account.uid, kind));
      const marker = await markerRef.get();
      if (marker.exists) continue;

      const content = noticeContent(kind, account);
      const inboxRef = db.collection("users").doc(account.uid).collection("inbox").doc(kind);
      const inboxDoc = await inboxRef.get();
      if (!inboxDoc.exists) {
        await inboxRef.set({
          kind,
          categoria: content.categoria,
          titulo: content.titulo,
          corpo: content.corpo,
          lida: false,
          emailResult: "pendente",
          createdAt: new Date(now).toISOString(),
        });
        result.noticesCreated += 1;
      }

      let emailResult = "nao_enviado";
      if (account.operationalEmail && account.email) {
        result.emailsAttempted += 1;
        const delivery = await sendOperationalEmail({
          to: account.email,
          subject: content.titulo,
          text: content.corpo,
        });
        emailResult = delivery.delivered ? "enviado" : delivery.reason;
        if (delivery.delivered) result.emailsDelivered += 1;
      } else if (!account.operationalEmail) {
        emailResult = "preferencia_desligada";
      }

      await inboxRef.set({ emailResult }, { merge: true });
      await markerRef.set({
        accountId: account.uid,
        kind,
        dayOffset: kind === "trial_7" ? 7 : kind === "trial_3" ? 3 : kind === "trial_1" ? 1 : 0,
        sentAt: new Date(now).toISOString(),
        emailResult,
      });
    }
  }

  return result;
}
