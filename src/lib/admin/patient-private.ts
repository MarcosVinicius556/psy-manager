export const PATIENT_PRIVATE_FIELD_KEYS = ["observacoes", "contatoEmergencia"] as const;

export type PatientPrivateFields = {
  observacoes: string;
  contatoEmergencia: string;
};

export function emptyPatientPrivate(): PatientPrivateFields {
  return { observacoes: "", contatoEmergencia: "" };
}

export function pickPatientPrivateFields(input: Record<string, unknown>): PatientPrivateFields {
  return {
    observacoes: typeof input.observacoes === "string" ? input.observacoes : "",
    contatoEmergencia: typeof input.contatoEmergencia === "string" ? input.contatoEmergencia : "",
  };
}

export function stripPatientPrivateFields<T extends Record<string, unknown>>(input: T) {
  const next = { ...input };
  for (const key of PATIENT_PRIVATE_FIELD_KEYS) delete next[key];
  return next;
}

export function patientPrivateDocId(ownerUid: string, patientId: string) {
  return `${ownerUid}_${patientId}`;
}
