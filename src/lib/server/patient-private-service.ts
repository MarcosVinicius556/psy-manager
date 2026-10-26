import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import {
  emptyPatientPrivate,
  patientPrivateDocId,
  pickPatientPrivateFields,
  type PatientPrivateFields,
} from "@/lib/admin/patient-private";

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function legacyPrivateFromPatient(data: Record<string, unknown>): PatientPrivateFields {
  return {
    observacoes: text(data.observacoes),
    contatoEmergencia: text(data.contatoEmergencia),
  };
}

export function mergePrivateFields(
  privateDoc: Record<string, unknown> | null,
  patientData: Record<string, unknown>
): PatientPrivateFields {
  const fromPrivate = privateDoc ? pickPatientPrivateFields(privateDoc) : emptyPatientPrivate();
  const legacy = legacyPrivateFromPatient(patientData);
  const hasPrivateDoc =
    privateDoc &&
    (text(privateDoc.observacoes).trim() || text(privateDoc.contatoEmergencia).trim());
  if (hasPrivateDoc) return fromPrivate;
  if (legacy.observacoes.trim() || legacy.contatoEmergencia.trim()) return legacy;
  return fromPrivate;
}

export async function readPatientPrivateForOwner(
  db: Firestore,
  ownerUid: string,
  patientId: string
): Promise<PatientPrivateFields | null> {
  const patientRef = db.collection("patients").doc(patientId);
  const patientSnap = await patientRef.get();
  if (!patientSnap.exists) return null;
  const patientData = patientSnap.data() || {};
  if (patientData.ownerUid !== ownerUid) return null;

  const privateSnap = await db.collection("patientPrivate").doc(patientPrivateDocId(ownerUid, patientId)).get();
  const privateData = privateSnap.exists ? (privateSnap.data() as Record<string, unknown>) : null;
  return mergePrivateFields(privateData, patientData as Record<string, unknown>);
}

export async function writePatientPrivateForOwner(
  db: Firestore,
  ownerUid: string,
  patientId: string,
  fields: PatientPrivateFields
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const patientRef = db.collection("patients").doc(patientId);
  const patientSnap = await patientRef.get();
  if (!patientSnap.exists) return { ok: false, reason: "paciente_nao_encontrado" };
  if (patientSnap.data()?.ownerUid !== ownerUid) return { ok: false, reason: "sem_permissao" };

  const privateRef = db.collection("patientPrivate").doc(patientPrivateDocId(ownerUid, patientId));
  await privateRef.set(
    {
      ownerUid,
      patientId,
      observacoes: fields.observacoes,
      contatoEmergencia: fields.contatoEmergencia,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  const legacy = legacyPrivateFromPatient(patientSnap.data() as Record<string, unknown>);
  if (legacy.observacoes.trim() || legacy.contatoEmergencia.trim()) {
    await patientRef.update({
      observacoes: FieldValue.delete(),
      contatoEmergencia: FieldValue.delete(),
    });
  }

  return { ok: true };
}
