export type PatientStatus = "ativo" | "inativo";

export type AppointmentStatus =
  | "agendado"
  | "em_andamento"
  | "concluido"
  | "cancelado"
  | "faltou";

export type Modality = "online" | "presencial";

export type SessionType = "conhecimento" | "padrao" | "emergencial" | "alta";

export type Mood = "calma" | "ansioso" | "triste" | "irritado" | "estavel";

export type PaymentStatus = "agendado" | "em_haver" | "pago" | "nao_pago";
export type PaymentOrigin = "paciente" | "externo";

export type PaymentMethod = "pix" | "dinheiro" | "cartao" | "transferencia" | "outro";
export type PaymentEventType = "lancamento" | "pagamento" | "situacao";

import type { CloudinaryAsset } from "@/lib/cloudinary/asset";

export type { CloudinaryAsset, CloudinaryResourceType } from "@/lib/cloudinary/asset";

export interface ClinicAttachment {
  id: string;
  nome: string;
  mime: string;
  /** URL pública legada (avatar ou anexos antes da migração). */
  url?: string;
  /** Referência Cloudinary com entrega `authenticated`. */
  asset?: CloudinaryAsset;
}

export interface PaymentEvent {
  id: string;
  tipo: PaymentEventType;
  valor: number;
  data: string;
  formaPagamento: PaymentMethod | "";
  parcial: boolean;
  observacao: string;
  comprovante: ClinicAttachment | null;
  createdAt: string;
}

export interface FiscalReceiptRecord {
  numero: number;
  arquivo: ClinicAttachment;
  emitidoEm: string;
  dataPagamento: string;
  valor: number;
}

export interface Patient {
  id: string;
  nome: string;
  cpf: string;
  cpfPagador: string;
  cpfBeneficiario: string;
  nascimento: string;
  telefone: string;
  email: string;
  endereco: string;
  contatoEmergencia: string;
  observacoes: string;
  /** URL pública legada; preferir `fotoAsset` para fotos novas. */
  foto: string;
  fotoAsset?: CloudinaryAsset | null;
  contratoAssinado: ClinicAttachment | null;
  status: PatientStatus;
  createdAt: string;
}

export interface ClinicalRecord {
  mood: Mood | "";
  clinicalEvolution: string;
  notes: string;
  aspectosCognitivos: string;
  aspectosEmocionais: string;
  intervencoes: string;
  objetivos: string;
  evolucaoSessao: string;
  anamneseArquivos: ClinicAttachment[];
  atividadesArquivos: ClinicAttachment[];
}

export interface CareLocation {
  id: string;
  nome: string;
  endereco: string;
  observacoes: string;
  memberIds: string[];
  memberUids: string[];
  createdByUid: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  professionalId: string | null;
  locationId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  modality: Modality;
  sessionType: SessionType;
  valor: number;
  valorSocial: boolean;
  packageId: string | null;
  packageVersao: number | null;
  creditoEmHaver: boolean;
  faltaJustificativa: string;
  recurring: boolean;
  seriesId: string | null;
  status: AppointmentStatus;
  clinical: ClinicalRecord;
  accessUids: string[];
  googleEventId: string | null;
  googleLocationEventId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkShift {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface ClinicMember {
  id: string;
  uid: string | null;
  nome: string;
  email: string;
  telefone: string;
  foto: string;
  cpf: string;
  crpNumero: string;
  crpRegiao: string;
  enderecoLogradouro: string;
  enderecoCidade: string;
  enderecoUf: string;
  enderecoCep: string;
  reciboSequencia: number;
  valorBase: number;
  valorSocial: number;
  workHours: WorkShift[];
  contratoModelo: string;
  ativo: boolean;
  createdAt: string;
}

export type ExpenseType = "fixo" | "variavel" | "parcelada";
export type InstallmentInterval = "semanal" | "mensal" | "anual";

export interface ExpenseShare {
  memberId: string;
  valor: number;
  paga: boolean;
}

export interface Expense {
  id: string;
  ownerUid: string;
  locationId: string | null;
  descricao: string;
  tipo: ExpenseType;
  valor: number;
  competencia: string;
  vencimento: string;
  paga: boolean;
  inicio: string;
  parcelas: number;
  parcelasRestantes: number;
  intervalo: InstallmentInterval | "";
  serieId: string;
  observacoes: string;
  shares: ExpenseShare[];
  accessUids: string[];
  createdAt: string;
}

export type PackageInterval = "semanal" | "quinzenal" | "mensal";
export type PackageType = PackageInterval | "personalizado";

export interface PackageAuditEntry {
  id: string;
  versao: number;
  quando: string;
  resumo: string;
  nome: string;
  tipo: PackageType;
  valorSessao: number;
  sessoes: number;
  observacoes: string;
}

export interface SessionPackage {
  id: string;
  professionalId: string | null;
  nome: string;
  tipo: PackageType;
  valorSessao: number;
  sessoes: number;
  versao: number;
  observacoes: string;
  historico: PackageAuditEntry[];
  arquivado: boolean;
  arquivadoEm: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  patientId: string;
  appointmentId: string | null;
  packageId: string | null;
  origem: PaymentOrigin;
  recorrente: boolean;
  seriesId: string | null;
  descricao: string;
  valor: number;
  valorAcordado: number;
  dueDate: string;
  status: PaymentStatus;
  paidAt: string | null;
  formaPagamento: PaymentMethod;
  historico: PaymentEvent[];
  reciboFiscal: FiscalReceiptRecord | null;
  createdAt: string;
}

export interface PaymentNotification {
  id: string;
  type: "payment_due";
  paymentId: string;
  patientId: string;
  date: string;
  lida: boolean;
  resposta: "pago" | "nao_pago" | null;
  createdAt: string;
}

export type PatientInput = Omit<Patient, "id" | "createdAt" | "contratoAssinado">;
export type AppointmentInput = Omit<
  Appointment,
  "id" | "createdAt" | "updatedAt" | "accessUids" | "creditoEmHaver" | "googleEventId" | "googleLocationEventId"
> & { googleEventId?: string | null; googleLocationEventId?: string | null };
export type ExpenseInput = Omit<Expense, "id" | "createdAt" | "accessUids" | "ownerUid">;
export type LocationInput = Pick<CareLocation, "nome" | "endereco" | "observacoes" | "memberIds" | "memberUids">;

export type LocationInviteStatus = "pendente" | "aceito" | "recusado";

export interface LocationInvite {
  id: string;
  locationId: string;
  locationNome: string;
  ownerUid: string;
  inviterNome: string;
  inviteeUid: string;
  inviteeEmail: string;
  inviteeNome: string;
  status: LocationInviteStatus;
  appointmentIds: string[];
  expenseIds: string[];
  createdAt: string;
}

export interface DirectoryUser {
  uid: string;
  email: string;
  nome: string;
  foto: string;
}

export interface SessionFeedback {
  id: string;
  appointmentId: string;
  patientId: string;
  professionalNome: string;
  patientNome: string;
  sessionDate: string;
  startTime: string;
  stars: number | null;
  comment: string;
  answeredAt: string | null;
  expiresAt: string;
  createdAt: string;
}
export type MemberInput = Pick<ClinicMember, "nome" | "email">;
export type PackageInput = Omit<SessionPackage, "id" | "createdAt" | "updatedAt" | "versao" | "historico" | "arquivado" | "arquivadoEm">;
export type PaymentInput = Omit<
  Payment,
  "id" | "createdAt" | "paidAt" | "status" | "packageId" | "valorAcordado" | "historico" | "origem" | "recorrente" | "seriesId" | "reciboFiscal"
> & {
  status?: PaymentStatus;
  packageId?: string | null;
  origem?: PaymentOrigin;
  recorrente?: boolean;
  seriesId?: string | null;
};

export function emptyClinical(): ClinicalRecord {
  return {
    mood: "",
    clinicalEvolution: "",
    notes: "",
    aspectosCognitivos: "",
    aspectosEmocionais: "",
    intervencoes: "",
    objetivos: "",
    evolucaoSessao: "",
    anamneseArquivos: [],
    atividadesArquivos: [],
  };
}

export function emptyPatient(): PatientInput {
  return {
    nome: "",
    cpf: "",
    cpfPagador: "",
    cpfBeneficiario: "",
    nascimento: "",
    telefone: "",
    email: "",
    endereco: "",
    contatoEmergencia: "",
    observacoes: "",
    foto: "",
    fotoAsset: null,
    status: "ativo",
  };
}
