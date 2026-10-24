import {
  appointmentOwnedByUid,
  patientOwnedByUid,
  paymentOwnedByUid,
} from "@/lib/server/clinic-access";

export type ParsedClinicAssetPath =
  | { kind: "clinic-owner"; ownerUid: string }
  | { kind: "patient-contract"; ownerUid: string; patientId: string }
  | { kind: "patient-tcle"; ownerUid: string; patientId: string }
  | { kind: "appointment-clinical"; ownerUid: string; appointmentId: string }
  | { kind: "payment-receipt"; ownerUid: string; paymentId: string }
  | { kind: "unsupported" };

/** Interpreta pastas usadas em `resolveUploadFolder` (sem extensão no public_id). */
export function parseClinicAssetPath(publicId: string): ParsedClinicAssetPath {
  const segments = publicId.split("/").filter(Boolean);
  if (segments[0] === "avatars") return { kind: "unsupported" };
  if (segments[0] !== "clinic" || segments.length < 3) return { kind: "unsupported" };
  const ownerUid = segments[1];
  const area = segments[2];
  if (area === "patients") {
    if (segments[3] === "photos") {
      return { kind: "clinic-owner", ownerUid };
    }
    if (segments.length >= 5 && segments[4] === "contracts") {
      return { kind: "patient-contract", ownerUid, patientId: segments[3] };
    }
    if (segments.length >= 5 && segments[4] === "tcle") {
      return { kind: "patient-tcle", ownerUid, patientId: segments[3] };
    }
  }
  if (area === "appointments" && segments.length >= 5) {
    const segment = segments[4];
    if (segment === "anamnese" || segment === "atividades") {
      return { kind: "appointment-clinical", ownerUid, appointmentId: segments[3] };
    }
  }
  if (area === "payments" && segments.length >= 5 && segments[4] === "comprovantes") {
    return { kind: "payment-receipt", ownerUid, paymentId: segments[3] };
  }
  if (area === "contracts" && segments[3] === "templates") {
    return { kind: "clinic-owner", ownerUid };
  }
  if (area === "reports") {
    return { kind: "clinic-owner", ownerUid };
  }
  return { kind: "unsupported" };
}

export async function authorizeClinicMediaAccess(publicId: string, requesterUid: string): Promise<boolean> {
  const parsed = parseClinicAssetPath(publicId);
  switch (parsed.kind) {
    case "clinic-owner":
      return parsed.ownerUid === requesterUid;
    case "patient-contract":
    case "patient-tcle":
      if (parsed.ownerUid !== requesterUid) return false;
      return patientOwnedByUid(parsed.patientId, requesterUid);
    case "appointment-clinical":
      if (parsed.ownerUid !== requesterUid) return false;
      return appointmentOwnedByUid(parsed.appointmentId, requesterUid);
    case "payment-receipt":
      if (parsed.ownerUid !== requesterUid) return false;
      return paymentOwnedByUid(parsed.paymentId, requesterUid);
    default:
      return false;
  }
}
