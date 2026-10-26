export type StaffPermission = "agenda" | "pacientes" | "financeiro";

export const STAFF_PERMISSIONS: StaffPermission[] = ["agenda", "pacientes", "financeiro"];

export type StaffInviteStatus = "pendente" | "aceito" | "revogado" | "expirado";

export interface StaffInvite {
  token: string;
  ownerUid: string;
  ownerNome: string;
  inviteeEmail: string;
  inviteeNome: string;
  perms: StaffPermission[];
  status: StaffInviteStatus;
  createdAt: string;
  expiresAtMillis: number;
  acceptedByUid?: string;
  acceptedAt?: string;
}

export interface StaffMember {
  id: string;
  ownerUid: string;
  staffUid: string;
  email: string;
  nome: string;
  perms: StaffPermission[];
  ativo: boolean;
  createdAt: string;
  revokedAt?: string;
}

export type ClinicMemberRole = "admin" | "profissional";

export type ClinicInviteStatus = "pendente" | "aceito" | "recusado" | "revogado";

export interface ClinicAccount {
  id: string;
  nome: string;
  adminUid: string;
  memberUids: string[];
  createdAt: string;
  locationId?: string;
}

export interface ClinicInvite {
  token: string;
  clinicId: string;
  clinicNome: string;
  inviterUid: string;
  inviterNome: string;
  inviteeEmail: string;
  inviteeNome: string;
  role: ClinicMemberRole;
  status: ClinicInviteStatus;
  createdAt: string;
  expiresAtMillis: number;
  acceptedByUid?: string;
}

export type WorkspaceKind = "owner" | "secretaria" | "clinica_admin" | "clinica_profissional";

export interface WorkspaceContext {
  kind: WorkspaceKind;
  /** Tenant whose data is shown (psychologist uid for staff; self for owner). */
  tenantOwnerUid: string;
  /** Authenticated user uid. */
  actorUid: string;
  staffPerms: StaffPermission[];
  clinicId: string | null;
  clinicRole: ClinicMemberRole | null;
  isClinicalAllowed: boolean;
}

export interface SupervisionShareRecord {
  token: string;
  ownerUid: string;
  patientId: string;
  expiresAtMillis: number;
  createdAt: string;
  createdByUid: string;
  reviewerConfirmed: boolean;
  payload: SupervisionCasePayload;
}

export interface SupervisionCasePayload {
  titulo: string;
  resumo: string;
  linhaDoTempo: { relativo: string; texto: string }[];
  avisos: string[];
}
