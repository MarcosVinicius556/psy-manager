import type { DailyCronJob } from "../runner";
import { mapAccount } from "@/lib/saas/account-store";
import { activationNoticesDue, noticeContent, type NoticeKind } from "@/lib/saas/model";
import { sendOperationalEmail } from "../../operational-mail";

function markerId(uid: string, kind: NoticeKind) {
  return `${uid}_${kind}`;
}

export const activationNudgesJob: DailyCronJob = {
  id: "activation_nudges",
  batchLimit: 500,
  async run(db, { now }) {
    const snapshot = await db.collection("users").where("subscriptionStatus", "==", "trial_ativo").get();
    let processed = 0;
    let notices = 0;

    for (const docSnap of snapshot.docs) {
      const account = mapAccount(docSnap.id, docSnap.data());
      if (!account.productEmail) continue;
      const markers = await db.collection("trialNoticeMarkers").where("accountId", "==", account.uid).get();
      const existingIds = markers.docs.map((item) => item.data().kind as string);
      const events = await db.collection("activationEvents").where("accountId", "==", account.uid).get();
      const onboardingComplete = events.docs.some((item) => item.data().event === "primeiro_pagamento");
      const due = activationNoticesDue(account, now, existingIds, onboardingComplete);
      if (!due.length) continue;
      processed += 1;

      for (const kind of due) {
        const markerRef = db.collection("trialNoticeMarkers").doc(markerId(account.uid, kind));
        if ((await markerRef.get()).exists) continue;
        const content = noticeContent(kind, account);
        const inboxRef = db.collection("users").doc(account.uid).collection("inbox").doc(kind);
        if (!(await inboxRef.get()).exists) {
          await inboxRef.set({
            kind,
            categoria: content.categoria,
            titulo: content.titulo,
            corpo: content.corpo,
            lida: false,
            emailResult: "pendente",
            createdAt: new Date(now).toISOString(),
          });
        }
        await markerRef.set({ accountId: account.uid, kind, at: new Date(now).toISOString() });
        notices += 1;
        if (account.email) {
          await sendOperationalEmail({
            to: account.email,
            subject: content.titulo,
            text: content.corpo,
          });
        }
      }
    }

    return { processed, notices, details: { job: "activation-nudges" } };
  },
};
