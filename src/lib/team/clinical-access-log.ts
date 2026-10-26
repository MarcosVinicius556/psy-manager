import { getAdminDb } from "@/lib/firebase-admin";

function dayKey(date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export type ClinicalAccessActorRole = "psicologo" | "secretaria" | "clinica_admin";

export async function recordClinicalAccessLog(input: {
  ownerUid: string;
  patientId: string;
  actorUid: string;
  actorNome: string;
  actorEmail: string;
  actorRole: ClinicalAccessActorRole;
  area: "prontuario" | "paciente_admin";
}) {
  const db = getAdminDb();
  if (!db) return;
  const docId = `${input.ownerUid}_${input.patientId}_${dayKey()}`;
  const ref = db.collection("clinicalAccessLog").doc(docId);
  const now = new Date().toISOString();
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() || {};
    const accesses = Array.isArray(data.accesses) ? [...data.accesses] : [];
    const idx = accesses.findIndex(
      (row) =>
        row &&
        typeof row === "object" &&
        (row as { actorUid?: string }).actorUid === input.actorUid &&
        (row as { area?: string }).area === input.area
    );
    if (idx >= 0) {
      const row = accesses[idx] as { count?: number };
      accesses[idx] = {
        ...accesses[idx],
        count: (Number(row.count) || 0) + 1,
        lastAt: now,
        actorRole: input.actorRole,
        actorNome: input.actorNome,
        actorEmail: input.actorEmail,
        area: input.area,
        actorUid: input.actorUid,
      };
    } else {
      accesses.push({
        actorUid: input.actorUid,
        actorNome: input.actorNome,
        actorEmail: input.actorEmail,
        actorRole: input.actorRole,
        area: input.area,
        count: 1,
        firstAt: now,
        lastAt: now,
      });
    }
    tx.set(
      ref,
      {
        ownerUid: input.ownerUid,
        patientId: input.patientId,
        day: dayKey(),
        accesses,
        updatedAt: now,
      },
      { merge: true }
    );
  });
}
