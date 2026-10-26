import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";

function todayKeyUtc() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

export function clinicalAccessLogDocId(uid: string, patientId: string, day = todayKeyUtc()) {
  return `${uid}_${patientId}_${day}`;
}

export async function recordClinicalAccess(
  db: Firestore,
  input: { uid: string; patientId: string; ownerUid: string; userLabel: string }
) {
  const docId = clinicalAccessLogDocId(input.uid, input.patientId);
  const ref = db.collection("clinicalAccessLog").doc(docId);
  await ref.set(
    {
      ownerUid: input.ownerUid,
      accessorUid: input.uid,
      accessorLabel: input.userLabel.slice(0, 120),
      patientId: input.patientId,
      day: todayKeyUtc(),
      count: FieldValue.increment(1),
      lastAccessAt: new Date().toISOString(),
    },
    { merge: true }
  );
}
