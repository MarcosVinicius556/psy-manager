import {
  appointmentAccessibleByUid,
  patientOwnedByUid,
  paymentOwnedByUid,
} from "@/lib/server/clinic-access";

export type UploadKind =
  | "avatar"
  | "patient-photo"
  | "patient-contract"
  | "patient-tcle"
  | "appointment-anamnese"
  | "appointment-atividade"
  | "payment-receipt"
  | "contract-template"
  | "report"
  | "support-ticket";

export type UploadAccept = "foto" | "documento" | "imagem";

export function parseUploadKind(value: string | null): UploadKind | null {
  const kinds: UploadKind[] = [
    "avatar",
    "patient-photo",
    "patient-contract",
    "patient-tcle",
    "appointment-anamnese",
    "appointment-atividade",
    "payment-receipt",
    "contract-template",
    "report",
    "support-ticket",
  ];
  return kinds.includes(value as UploadKind) ? (value as UploadKind) : null;
}

export function parseUploadAccept(searchParams: URLSearchParams): UploadAccept {
  const accept = searchParams.get("accept");
  if (accept === "documento" || accept === "foto") return accept;
  return "imagem";
}

export async function resolveUploadFolder(
  kind: UploadKind,
  uid: string,
  ids: { patientId?: string; appointmentId?: string; paymentId?: string; ticketId?: string }
): Promise<{ folder: string } | { error: string; status: number }> {
  switch (kind) {
    case "avatar":
      return { folder: `avatars/${uid}` };
    case "patient-photo":
      return { folder: `clinic/${uid}/patients/photos` };
    case "patient-contract": {
      const patientId = ids.patientId?.trim() || "";
      if (!patientId) return { error: "Paciente inválido.", status: 400 };
      if (!(await patientOwnedByUid(patientId, uid))) return { error: "Sem permissão para este paciente.", status: 403 };
      return { folder: `clinic/${uid}/patients/${patientId}/contracts` };
    }
    case "patient-tcle": {
      const patientId = ids.patientId?.trim() || "";
      if (!patientId) return { error: "Paciente inválido.", status: 400 };
      if (!(await patientOwnedByUid(patientId, uid))) return { error: "Sem permissão para este paciente.", status: 403 };
      return { folder: `clinic/${uid}/patients/${patientId}/tcle` };
    }
    case "appointment-anamnese":
    case "appointment-atividade": {
      const appointmentId = ids.appointmentId?.trim() || "";
      if (!appointmentId) return { error: "Sessão inválida.", status: 400 };
      if (!(await appointmentAccessibleByUid(appointmentId, uid))) {
        return { error: "Sem permissão para esta sessão.", status: 403 };
      }
      const segment = kind === "appointment-anamnese" ? "anamnese" : "atividades";
      return { folder: `clinic/${uid}/appointments/${appointmentId}/${segment}` };
    }
    case "payment-receipt": {
      const paymentId = ids.paymentId?.trim() || "";
      if (!paymentId) return { error: "Pagamento inválido.", status: 400 };
      if (!(await paymentOwnedByUid(paymentId, uid))) return { error: "Sem permissão para este pagamento.", status: 403 };
      return { folder: `clinic/${uid}/payments/${paymentId}/comprovantes` };
    }
    case "contract-template":
      return { folder: `clinic/${uid}/contracts/templates` };
    case "report":
      return { folder: `clinic/${uid}/reports` };
    case "support-ticket": {
      const ticketId = ids.ticketId?.trim() || "";
      if (!ticketId) return { error: "Chamado inválido.", status: 400 };
      return { folder: `support/tickets/${ticketId}` };
    }
    default:
      return { error: "Tipo de envio inválido.", status: 400 };
  }
}
