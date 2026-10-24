import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { isPaymentMethod } from "./format";
import { buildLegacyAccount, buildReplayDeniedAccount, buildTrialAccount, expirePatch } from "../saas/model";
import { reserveTrial } from "../saas/account-store";
import { assertClinicWrite } from "../saas/guard";
import { getFirebaseAuth, getFirebaseDb } from "./firebase";
import {
  contractVersionSummary,
  type ContractTemplate,
  type ContractTemplateVersion,
} from "./contract";
import { parseTemplateDefinition, type ReportDefinition, type ReportRun, type ReportStore, type ReportTemplate } from "./reports";
import {
  emptyClinical,
  type Appointment,
  type AppointmentInput,
  type AppointmentStatus,
  type ClinicalRecord,
  type ClinicAttachment,
  type ClinicMember,
  type CareLocation,
  type DirectoryUser,
  type Expense,
  type ExpenseInput,
  type ExpenseShare,
  type ExpenseType,
  type LocationInput,
  type LocationInvite,
  type MemberInput,
  type Modality,
  type Mood,
  type Patient,
  type PatientInput,
  type Payment,
  type PaymentEvent,
  type PaymentInput,
  type PaymentMethod,
  type PaymentNotification,
  type PaymentStatus,
  type SessionFeedback,
  type PackageType,
  type PackageAuditEntry,
  type SessionPackage,
  type SessionType,
  type PackageInput,
  type WorkShift,
} from "./types";

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function memberScore(data: DocumentData) {
  return (text(data.foto) ? 4 : 0) + (Array.isArray(data.workHours) && data.workHours.length ? 2 : 0) + (text(data.telefone) ? 1 : 0);
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapAttachment(value: unknown): ClinicAttachment | null {
  const data = (value ?? {}) as Partial<ClinicAttachment>;
  const url = text(data.url);
  if (!url) return null;
  return {
    id: text(data.id) || url,
    nome: text(data.nome) || "Arquivo",
    url,
    mime: text(data.mime),
  };
}

function mapAttachments(value: unknown) {
  return Array.isArray(value) ? value.map(mapAttachment).filter((item): item is ClinicAttachment => Boolean(item)) : [];
}

function mapClinical(value: unknown): ClinicalRecord {
  const data = (value ?? {}) as Partial<ClinicalRecord>;
  const base = emptyClinical();
  return {
    mood: (data.mood as Mood) || "",
    clinicalEvolution: text(data.clinicalEvolution),
    notes: text(data.notes),
    aspectosCognitivos: text(data.aspectosCognitivos),
    aspectosEmocionais: text(data.aspectosEmocionais),
    intervencoes: text(data.intervencoes),
    objetivos: text(data.objetivos),
    evolucaoSessao: text(data.evolucaoSessao),
    anamneseArquivos: mapAttachments(data.anamneseArquivos),
    atividadesArquivos: mapAttachments(data.atividadesArquivos),
  };
}

function mapPatient(id: string, data: DocumentData): Patient {
  return {
    id,
    nome: text(data.nome),
    cpf: text(data.cpf),
    nascimento: text(data.nascimento),
    telefone: text(data.telefone),
    email: text(data.email),
    endereco: text(data.endereco),
    contatoEmergencia: text(data.contatoEmergencia),
    observacoes: text(data.observacoes),
    foto: text(data.foto),
    contratoAssinado: mapAttachment(data.contratoAssinado),
    status: data.status === "inativo" ? "inativo" : "ativo",
    createdAt: text(data.createdAt),
  };
}

function mapAppointment(id: string, data: DocumentData): Appointment {
  const status = text(data.status) as AppointmentStatus;
  const modality = text(data.modality) as Modality;
  return {
    id,
    patientId: text(data.patientId),
    date: text(data.date),
    startTime: text(data.startTime),
    endTime: text(data.endTime),
    modality: modality === "online" ? "online" : "presencial",
    professionalId: data.professionalId ? text(data.professionalId) : null,
    locationId: data.locationId ? text(data.locationId) : null,
    sessionType: (["conhecimento", "padrao", "emergencial", "alta"].includes(text(data.sessionType))
      ? text(data.sessionType)
      : "padrao") as SessionType,
    valor: Number(data.valor) || 0,
    valorSocial: Boolean(data.valorSocial),
    packageId: data.packageId ? text(data.packageId) : null,
    packageVersao: Number(data.packageVersao) > 0 ? Number(data.packageVersao) : null,
    creditoEmHaver: Boolean(data.creditoEmHaver),
    faltaJustificativa: text(data.faltaJustificativa),
    recurring: Boolean(data.recurring),
    seriesId: data.seriesId ? text(data.seriesId) : null,
    status: ["agendado", "em_andamento", "concluido", "cancelado", "faltou"].includes(status)
      ? status
      : "agendado",
    clinical: mapClinical(data.clinical),
    accessUids: strings(data.accessUids),
    createdAt: text(data.createdAt),
    updatedAt: text(data.updatedAt),
  };
}

function paymentMethod(value: unknown): PaymentMethod | "" {
  const method = text(value);
  return isPaymentMethod(method) ? method : "";
}

function mapPaymentEvent(value: unknown, index: number): PaymentEvent | null {
  const data = (value ?? {}) as Partial<PaymentEvent>;
  const tipo = data.tipo === "pagamento" || data.tipo === "situacao" || data.tipo === "lancamento" ? data.tipo : "";
  if (!tipo) return null;
  return {
    id: text(data.id) || `evento-${index}`,
    tipo,
    valor: Number(data.valor) || 0,
    data: text(data.data),
    formaPagamento: paymentMethod(data.formaPagamento),
    parcial: Boolean(data.parcial),
    observacao: text(data.observacao),
    comprovante: mapAttachment(data.comprovante),
    createdAt: text(data.createdAt),
  };
}

function launchEvent(input: PaymentInput, createdAt: string): PaymentEvent {
  return {
    id: crypto.randomUUID(),
    tipo: "lancamento",
    valor: input.valor,
    data: input.dueDate,
    formaPagamento: "",
    parcial: false,
    observacao: input.descricao.trim() || "Lançamento",
    comprovante: null,
    createdAt,
  };
}

function mapPayment(id: string, data: DocumentData): Payment {
  const status = text(data.status) as PaymentStatus;
  const method = paymentMethod(data.formaPagamento);
  const valor = Number(data.valor) || 0;
  return {
    id,
    patientId: text(data.patientId),
    appointmentId: data.appointmentId ? text(data.appointmentId) : null,
    packageId: data.packageId ? text(data.packageId) : null,
    origem: data.origem === "externo" ? "externo" : "paciente",
    recorrente: Boolean(data.recorrente),
    seriesId: data.seriesId ? text(data.seriesId) : null,
    descricao: text(data.descricao),
    valor,
    valorAcordado: Number(data.valorAcordado) || valor,
    dueDate: text(data.dueDate),
    status: status === "pago" || status === "nao_pago" || status === "em_haver" ? status : "agendado",
    paidAt: data.paidAt ? text(data.paidAt) : null,
    formaPagamento: method || "pix",
    historico: Array.isArray(data.historico)
      ? data.historico.map(mapPaymentEvent).filter((event): event is PaymentEvent => Boolean(event))
      : [],
    createdAt: text(data.createdAt),
  };
}

function mapNotification(id: string, data: DocumentData): PaymentNotification {
  const resposta = data.resposta === "pago" || data.resposta === "nao_pago" ? data.resposta : null;
  return {
    id,
    type: "payment_due",
    paymentId: text(data.paymentId),
    patientId: text(data.patientId),
    date: text(data.date),
    lida: Boolean(data.lida),
    resposta,
    createdAt: text(data.createdAt),
  };
}

const ownedCollections = ["patients", "appointments", "payments", "packages", "notifications", "members", "locations", "expenses"] as const;

function currentOwnerUid() {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) throw new Error("Faça login para continuar.");
  return uid;
}

async function listCollection<T>(name: string, map: (id: string, data: DocumentData) => T) {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) return [];
  const snapshot = await getDocs(query(collection(getFirebaseDb(), name), where("ownerUid", "==", uid)));
  return snapshot.docs.map((item) => map(item.id, item.data()));
}

async function listShared<T extends { id: string }>(
  name: string,
  shareField: string,
  map: (id: string, data: DocumentData) => T
) {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) return [];
  const base = collection(getFirebaseDb(), name);
  const owned = await getDocs(query(base, where("ownerUid", "==", uid)));
  let sharedDocs: typeof owned.docs = [];
  try {
    sharedDocs = (await getDocs(query(base, where(shareField, "array-contains", uid)))).docs;
  } catch (error) {
    console.error(error);
  }
  const byId = new Map<string, T>();
  for (const item of [...owned.docs, ...sharedDocs]) byId.set(item.id, map(item.id, item.data()));
  return [...byId.values()];
}

export async function claimUnownedRecords(uid: string) {
  assertClinicWrite();
  const db = getFirebaseDb();
  for (const name of ownedCollections) {
    const snapshot = await getDocs(collection(db, name));
    let batch = writeBatch(db);
    let count = 0;
    const commit = async () => {
      if (!count) return;
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    };
    for (const item of snapshot.docs) {
      const data = item.data();
      if (typeof data.ownerUid === "string" && data.ownerUid) continue;
      if (name === "members" && typeof data.uid === "string" && data.uid && data.uid !== uid) continue;
      if (name === "locations" && typeof data.createdByUid === "string" && data.createdByUid && data.createdByUid !== uid) continue;
      const patch: Record<string, unknown> = { ownerUid: uid };
      if (name === "locations" && strings(data.memberUids).length === 0) patch.memberUids = [uid];
      if ((name === "appointments" || name === "expenses") && strings(data.accessUids).length === 0) patch.accessUids = [uid];
      batch.update(item.ref, patch);
      count += 1;
      if (count === 400) await commit();
    }
    await commit();
  }
}

export function listPatients() {
  return listCollection("patients", mapPatient);
}

export function listAppointments() {
  return listShared("appointments", "accessUids", mapAppointment);
}

export function listPayments() {
  return listCollection("payments", mapPayment);
}

function mapPackageType(data: DocumentData): PackageType {
  const raw = text(data.tipo);
  if (raw === "semanal" || raw === "quinzenal" || raw === "mensal" || raw === "personalizado") return raw;
  const nome = text(data.nome).toLowerCase();
  if (nome.includes("quinzen")) return "quinzenal";
  if (nome.includes("mensal")) return "mensal";
  return "quinzenal";
}

function mapPackageAudit(value: unknown, index: number): PackageAuditEntry | null {
  const data = (value ?? {}) as Partial<PackageAuditEntry>;
  const tipo = text(data.tipo);
  if (tipo !== "semanal" && tipo !== "quinzenal" && tipo !== "mensal" && tipo !== "personalizado") return null;
  return {
    id: text(data.id) || `versao-${index}`,
    versao: Number(data.versao) || index + 1,
    quando: text(data.quando),
    resumo: text(data.resumo),
    nome: text(data.nome),
    tipo,
    valorSessao: Number(data.valorSessao) || 0,
    sessoes: Math.max(1, Number(data.sessoes) || 1),
    observacoes: text(data.observacoes),
  };
}

function mapPackage(id: string, data: DocumentData): SessionPackage {
  const createdAt = text(data.createdAt);
  return {
    id,
    professionalId: data.professionalId ? text(data.professionalId) : null,
    nome: text(data.nome),
    tipo: mapPackageType(data),
    valorSessao: Number(data.valorSessao) || 0,
    sessoes: Math.max(1, Number(data.sessoes) || 1),
    versao: Math.max(1, Number(data.versao) || 1),
    observacoes: text(data.observacoes),
    historico: Array.isArray(data.historico)
      ? data.historico.map(mapPackageAudit).filter((item): item is PackageAuditEntry => Boolean(item))
      : [],
    arquivado: Boolean(data.arquivado),
    arquivadoEm: data.arquivadoEm ? text(data.arquivadoEm) : null,
    createdAt,
    updatedAt: text(data.updatedAt) || createdAt,
  };
}

export function listPackages() {
  return listCollection("packages", mapPackage);
}

export async function createPackage(input: PackageInput, historico: PackageAuditEntry[]) {
  assertClinicWrite();
  const now = new Date().toISOString();
  const ref = await addDoc(collection(getFirebaseDb(), "packages"), {
    ...input,
    professionalId: input.professionalId || null,
    sessoes: Math.max(1, input.sessoes || 1),
    versao: 1,
    historico,
    arquivado: false,
    arquivadoEm: null,
    ownerUid: currentOwnerUid(),
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updatePackage(id: string, input: PackageInput, versao: number, historico: PackageAuditEntry[]) {
  assertClinicWrite();
  await updateDoc(doc(getFirebaseDb(), "packages", id), {
    ...input,
    professionalId: input.professionalId || null,
    sessoes: Math.max(1, input.sessoes || 1),
    versao,
    historico,
    updatedAt: new Date().toISOString(),
  });
}

export async function setPackageArchived(id: string, arquivado: boolean, historico: PackageAuditEntry[]) {
  assertClinicWrite();
  const now = new Date().toISOString();
  await updateDoc(doc(getFirebaseDb(), "packages", id), {
    arquivado,
    arquivadoEm: arquivado ? now : null,
    historico,
    updatedAt: now,
  });
}

export function listNotifications() {
  return listCollection("notifications", mapNotification);
}

function mapWorkShift(value: unknown): WorkShift | null {
  const data = (value ?? {}) as Partial<WorkShift>;
  const weekday = Number(data.weekday);
  const startTime = text(data.startTime);
  const endTime = text(data.endTime);
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6 || !startTime || !endTime) return null;
  return { weekday, startTime, endTime };
}

function mapMember(id: string, data: DocumentData): ClinicMember {
  return {
    id,
    uid: data.uid ? text(data.uid) : null,
    nome: text(data.nome) || text(data.email),
    email: text(data.email),
    telefone: text(data.telefone),
    foto: text(data.foto),
    valorBase: Number(data.valorBase) || 0,
    valorSocial: Number(data.valorSocial) || 0,
    workHours: Array.isArray(data.workHours)
      ? data.workHours.map(mapWorkShift).filter((item): item is WorkShift => Boolean(item))
      : [],
    contratoModelo: text(data.contratoModelo),
    ativo: data.ativo !== false,
    createdAt: text(data.createdAt),
  };
}

function mapShare(value: unknown): ExpenseShare {
  const data = (value ?? {}) as Partial<ExpenseShare>;
  return { memberId: text(data.memberId), valor: Number(data.valor) || 0, paga: Boolean(data.paga) };
}

function mapExpense(id: string, data: DocumentData): Expense {
  const tipo = text(data.tipo) as ExpenseType;
  return {
    id,
    locationId: data.locationId ? text(data.locationId) : null,
    ownerUid: text(data.ownerUid),
    descricao: text(data.descricao),
    tipo: tipo === "variavel" || tipo === "parcelada" ? tipo : "fixo",
    valor: Number(data.valor) || 0,
    competencia: text(data.competencia),
    vencimento: text(data.vencimento),
    paga: Boolean(data.paga),
    inicio: text(data.inicio),
    parcelas: Number(data.parcelas) || 0,
    parcelasRestantes: Number(data.parcelasRestantes) || 0,
    intervalo: data.intervalo === "semanal" || data.intervalo === "mensal" || data.intervalo === "anual" ? data.intervalo : "",
    serieId: text(data.serieId),
    observacoes: text(data.observacoes),
    shares: Array.isArray(data.shares) ? data.shares.map(mapShare) : [],
    accessUids: strings(data.accessUids),
    createdAt: text(data.createdAt),
  };
}

export function listMembers() {
  return listCollection("members", mapMember);
}

export function listExpenses() {
  return listShared("expenses", "accessUids", mapExpense);
}

function mapLocation(id: string, data: DocumentData): CareLocation {
  return {
    id,
    nome: text(data.nome),
    endereco: text(data.endereco),
    observacoes: text(data.observacoes),
    memberIds: strings(data.memberIds),
    memberUids: strings(data.memberUids),
    createdByUid: text(data.createdByUid),
    createdAt: text(data.createdAt),
  };
}

export function listLocations() {
  return listShared("locations", "memberUids", mapLocation);
}

export async function createLocation(input: LocationInput, createdByUid: string) {
  assertClinicWrite();
  const ref = await addDoc(collection(getFirebaseDb(), "locations"), {
    nome: input.nome.trim(),
    endereco: input.endereco.trim(),
    observacoes: input.observacoes.trim(),
    memberIds: input.memberIds,
    memberUids: Array.from(new Set([createdByUid, ...input.memberUids])),
    createdByUid,
    ownerUid: createdByUid,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateLocation(id: string, input: Pick<LocationInput, "nome" | "endereco" | "observacoes">) {
  assertClinicWrite();
  await updateDoc(doc(getFirebaseDb(), "locations", id), {
    nome: input.nome.trim(),
    endereco: input.endereco.trim(),
    observacoes: input.observacoes.trim(),
  });
}

export async function removeLocation(id: string) {
  assertClinicWrite();
  await deleteDoc(doc(getFirebaseDb(), "locations", id));
}

export async function createMember(input: MemberInput) {
  assertClinicWrite();
  const ref = await addDoc(collection(getFirebaseDb(), "members"), {
    nome: input.nome.trim(),
    email: input.email.trim().toLowerCase(),
    ownerUid: currentOwnerUid(),
    uid: null,
    telefone: "",
    foto: "",
    valorBase: 0,
    valorSocial: 0,
    workHours: [],
    ativo: true,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateMember(id: string, patch: Partial<ClinicMember>) {
  assertClinicWrite();
  const { id: _id, ...rest } = patch;
  const data = { ...rest } as Record<string, unknown>;
  delete data.ownerUid;
  await updateDoc(doc(getFirebaseDb(), "members", id), data);
}

export async function createExpense(input: ExpenseInput, accessUids: string[] = []) {
  assertClinicWrite();
  const ownerUid = currentOwnerUid();
  const ref = await addDoc(collection(getFirebaseDb(), "expenses"), {
    ...input,
    ownerUid,
    accessUids: Array.from(new Set([ownerUid, ...accessUids])),
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateExpense(id: string, input: ExpenseInput, accessUids?: string[]) {
  assertClinicWrite();
  const ownerUid = currentOwnerUid();
  await updateDoc(doc(getFirebaseDb(), "expenses", id), {
    ...input,
    ...(accessUids ? { accessUids: Array.from(new Set([ownerUid, ...accessUids])) } : {}),
  });
}

export async function patchExpense(
  id: string,
  patch: Partial<Pick<Expense, "paga" | "parcelasRestantes" | "vencimento" | "shares">>
) {
  assertClinicWrite();
  await updateDoc(doc(getFirebaseDb(), "expenses", id), patch);
}

export async function removeExpense(id: string) {
  assertClinicWrite();
  await deleteDoc(doc(getFirebaseDb(), "expenses", id));
}

export async function createPatient(input: PatientInput) {
  assertClinicWrite();
  const ref = await addDoc(collection(getFirebaseDb(), "patients"), {
    ...input,
    ownerUid: currentOwnerUid(),
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updatePatient(id: string, input: PatientInput) {
  assertClinicWrite();
  await updateDoc(doc(getFirebaseDb(), "patients", id), input);
}

export async function setPatientSignedContract(id: string, file: ClinicAttachment | null) {
  assertClinicWrite();
  await updateDoc(doc(getFirebaseDb(), "patients", id), { contratoAssinado: file });
}

export async function createAppointment(input: AppointmentInput, accessUids: string[] = []) {
  assertClinicWrite();
  const now = new Date().toISOString();
  const ownerUid = currentOwnerUid();
  const ref = await addDoc(collection(getFirebaseDb(), "appointments"), {
    ...input,
    ownerUid,
    accessUids: Array.from(new Set([ownerUid, ...accessUids])),
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function createAppointmentSeries(inputs: AppointmentInput[], accessUids: string[] = []) {
  assertClinicWrite();
  const batch = writeBatch(getFirebaseDb());
  const now = new Date().toISOString();
  const ownerUid = currentOwnerUid();
  const viewers = Array.from(new Set([ownerUid, ...accessUids]));
  const refs = inputs.map(() => doc(collection(getFirebaseDb(), "appointments")));
  refs.forEach((ref, index) => {
    batch.set(ref, { ...inputs[index], ownerUid, accessUids: viewers, createdAt: now, updatedAt: now });
  });
  await batch.commit();
  return refs.map((ref) => ref.id);
}

export async function updateAppointment(id: string, patch: Partial<AppointmentInput> & { status?: AppointmentStatus; creditoEmHaver?: boolean }) {
  assertClinicWrite();
  await updateDoc(doc(getFirebaseDb(), "appointments", id), {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

function paymentRecord(input: PaymentInput, createdAt: string) {
  const external = input.origem === "externo";
  return {
    ...input,
    patientId: external ? "" : input.patientId,
    appointmentId: external ? null : input.appointmentId || null,
    packageId: external ? null : input.packageId || null,
    origem: external ? "externo" : "paciente",
    recorrente: external ? Boolean(input.recorrente) : false,
    seriesId: external ? input.seriesId || null : null,
    valorAcordado: input.valor,
    historico: [launchEvent(input, createdAt)],
    status: input.status ?? "agendado",
    paidAt: null,
    ownerUid: currentOwnerUid(),
    createdAt,
  };
}

export async function createPayment(input: PaymentInput) {
  assertClinicWrite();
  const now = new Date().toISOString();
  const ref = await addDoc(collection(getFirebaseDb(), "payments"), paymentRecord(input, now));
  return ref.id;
}

export async function createPayments(inputs: PaymentInput[]) {
  assertClinicWrite();
  if (inputs.length === 0) return [];
  const batch = writeBatch(getFirebaseDb());
  const now = new Date().toISOString();
  const refs = inputs.map(() => doc(collection(getFirebaseDb(), "payments")));
  refs.forEach((ref, index) => {
    const input = inputs[index];
    batch.set(ref, paymentRecord(input, now));
  });
  await batch.commit();
  return refs.map((ref) => ref.id);
}

export async function updatePayment(id: string, patch: Partial<Payment>) {
  assertClinicWrite();
  const { id: _id, ...rest } = patch;
  await updateDoc(doc(getFirebaseDb(), "payments", id), rest);
}

export async function createNotification(notification: Omit<PaymentNotification, "id">) {
  assertClinicWrite();
  const ref = await addDoc(collection(getFirebaseDb(), "notifications"), {
    ...notification,
    ownerUid: currentOwnerUid(),
  });
  return ref.id;
}

export async function updateNotification(id: string, patch: Partial<PaymentNotification>) {
  assertClinicWrite();
  const { id: _id, ...rest } = patch;
  await updateDoc(doc(getFirebaseDb(), "notifications", id), rest);
}

export async function removeNotification(id: string) {
  assertClinicWrite();
  await deleteDoc(doc(getFirebaseDb(), "notifications", id));
}

export async function upsertPsychologist(uid: string, email: string, extras?: { nome?: string; foto?: string }) {
  const normalized = email.trim().toLowerCase();
  const membersRef = collection(getFirebaseDb(), "members");
  let current: { ref: ReturnType<typeof doc>; data: () => DocumentData } | undefined;
  try {
    const byUid = await getDocs(query(membersRef, where("uid", "==", uid)));
    const ranked = [...byUid.docs].sort((a, b) => memberScore(b.data()) - memberScore(a.data()));
    current = ranked[0];
    for (const extra of ranked.slice(1)) await deleteDoc(extra.ref);
  } catch {
    current = undefined;
  }
  if (!current) {
    const byOwner = await getDocs(query(membersRef, where("ownerUid", "==", uid)));
    current = byOwner.docs.find((item) => text(item.data().email) === normalized || item.data().uid === uid);
  }
  const fallback = normalized.split("@")[0];
  const suggestedName = extras?.nome?.trim() || "";
  const existingName = current ? text(current.data().nome) : "";
  const nome = existingName && existingName !== fallback ? existingName : suggestedName || existingName || fallback;
  const foto = (current ? text(current.data().foto) : "") || extras?.foto?.trim() || "";
  if (current) {
    await updateDoc(current.ref, { uid, ownerUid: uid, email: normalized, nome, foto, ativo: true });
  } else {
    await addDoc(membersRef, {
      uid,
      ownerUid: uid,
      email: normalized,
      nome,
      telefone: "",
      foto: "",
      valorBase: 0,
      valorSocial: 0,
      workHours: [],
      ativo: true,
      createdAt: new Date().toISOString(),
    });
  }
  const userRef = doc(getFirebaseDb(), "users", uid);
  const profile = await getDoc(userRef);
  const role = profile.data()?.role === "super_admin" ? "super_admin" : "psicologo";
  if (!profile.exists()) {
    const eligible = await reserveTrial(normalized, uid);
    const stamp = new Date().toISOString();
    const account = eligible
      ? buildTrialAccount({ uid, email: normalized, nome, clinicName: "", now: Date.now(), termsAcceptedAt: stamp })
      : buildReplayDeniedAccount({ uid, email: normalized, nome, clinicName: "", now: Date.now(), termsAcceptedAt: stamp });
    await setDoc(userRef, account);
  } else {
    await setDoc(userRef, { uid, email: normalized, role }, { merge: true });
    const data = profile.data() ?? {};
    if (role !== "super_admin" && !data.billingAccess) {
      await updateDoc(userRef, buildLegacyAccount(new Date().toISOString()));
    } else if (data.subscriptionStatus === "trial_ativo" && Number(data.trialEndsAtMillis) > 0 && Number(data.trialEndsAtMillis) <= Date.now()) {
      await updateDoc(userRef, expirePatch(new Date().toISOString()));
    }
  }
  await publishDirectory({ uid, email: normalized, nome, foto });
}

export async function getUserRole(uid: string) {
  const snapshot = await getDoc(doc(getFirebaseDb(), "users", uid));
  return snapshot.data()?.role === "super_admin" ? "super_admin" : "psicologo";
}

export async function provisionPsychologist(input: { uid: string; nome: string; email: string }) {
  const email = input.email.trim().toLowerCase();
  const nome = input.nome.trim();
  const stamp = new Date().toISOString();
  await setDoc(doc(getFirebaseDb(), "users", input.uid), {
    uid: input.uid,
    email,
    nome,
    role: "psicologo",
    createdAt: stamp,
    operationalEmail: true,
    productEmail: true,
    onboardingDismissed: false,
    ...buildLegacyAccount(stamp),
  });
  await addDoc(collection(getFirebaseDb(), "members"), {
    uid: input.uid,
    ownerUid: input.uid,
    email,
    nome,
    telefone: "",
    foto: "",
    valorBase: 0,
    valorSocial: 0,
    workHours: [],
    ativo: true,
    createdAt: new Date().toISOString(),
  });
  await publishDirectory({ uid: input.uid, email, nome, foto: "" });
}

export async function publishDirectory(profile: DirectoryUser) {
  const email = profile.email.trim().toLowerCase();
  if (!email) return;
  await setDoc(doc(getFirebaseDb(), "directory", email), { ...profile, email, ownerUid: profile.uid }, { merge: true });
}

export async function findDirectoryUser(email: string) {
  const id = email.trim().toLowerCase();
  if (!id) return null;
  const snapshot = await getDoc(doc(getFirebaseDb(), "directory", id));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  const uid = text(data.uid);
  if (!uid) return null;
  return { uid, email: text(data.email) || id, nome: text(data.nome) || id, foto: text(data.foto) };
}

function mapInvite(id: string, data: DocumentData): LocationInvite {
  const status = text(data.status);
  return {
    id,
    locationId: text(data.locationId),
    locationNome: text(data.locationNome),
    ownerUid: text(data.ownerUid),
    inviterNome: text(data.inviterNome),
    inviteeUid: text(data.inviteeUid),
    inviteeEmail: text(data.inviteeEmail),
    inviteeNome: text(data.inviteeNome),
    status: status === "aceito" || status === "recusado" ? status : "pendente",
    appointmentIds: strings(data.appointmentIds),
    expenseIds: strings(data.expenseIds),
    createdAt: text(data.createdAt),
  };
}

export async function listLocationInvites() {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) return [];
  const base = collection(getFirebaseDb(), "locationInvites");
  const byId = new Map<string, LocationInvite>();
  const load = async (field: "ownerUid" | "inviteeUid") => {
    try {
      const snapshot = await getDocs(query(base, where(field, "==", uid)));
      for (const item of snapshot.docs) byId.set(item.id, mapInvite(item.id, item.data()));
    } catch (error) {
      console.error(error);
    }
  };
  await load("ownerUid");
  await load("inviteeUid");
  return [...byId.values()];
}

export async function createLocationInvite(invite: Omit<LocationInvite, "id" | "status" | "createdAt">) {
  assertClinicWrite();
  const id = `${invite.locationId}_${invite.inviteeUid}`;
  await setDoc(doc(getFirebaseDb(), "locationInvites", id), {
    ...invite,
    status: "pendente",
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function setLocationInviteStatus(id: string, status: LocationInvite["status"]) {
  await updateDoc(doc(getFirebaseDb(), "locationInvites", id), { status });
}

export async function addLocationMemberUid(locationId: string, uid: string) {
  await updateDoc(doc(getFirebaseDb(), "locations", locationId), { memberUids: arrayUnion(uid) });
}

export async function grantAccess(collectionName: "appointments" | "expenses", id: string, uids: string[]) {
  if (uids.length === 0) return;
  await updateDoc(doc(getFirebaseDb(), collectionName, id), { accessUids: arrayUnion(...uids) });
}

export const FEEDBACK_TTL_MS = 48 * 60 * 60 * 1000;

function mapFeedback(id: string, data: DocumentData): SessionFeedback {
  const stars = Number(data.stars);
  return {
    id,
    appointmentId: text(data.appointmentId),
    patientId: text(data.patientId),
    professionalNome: text(data.professionalNome),
    patientNome: text(data.patientNome),
    sessionDate: text(data.sessionDate),
    startTime: text(data.startTime),
    stars: Number.isInteger(stars) && stars >= 1 && stars <= 5 ? stars : null,
    comment: text(data.comment),
    answeredAt: data.answeredAt ? text(data.answeredAt) : null,
    expiresAt: text(data.expiresAt),
    createdAt: text(data.createdAt),
  };
}

export function listSessionFeedbacks() {
  return listCollection("sessionFeedbacks", mapFeedback);
}

export async function createSessionFeedback(input: {
  appointmentId: string;
  patientId: string;
  professionalNome: string;
  patientNome: string;
  sessionDate: string;
  startTime: string;
}) {
  assertClinicWrite();
  const token = crypto.randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + FEEDBACK_TTL_MS);
  const createdAt = now.toISOString();
  const expiresAt = expires.toISOString();
  await setDoc(doc(getFirebaseDb(), "sessionFeedbacks", token), {
    ...input,
    stars: null,
    comment: "",
    answeredAt: null,
    answeredAtMillis: null,
    expiresAt,
    expiresAtMillis: expires.getTime(),
    ownerUid: currentOwnerUid(),
    createdAt,
  });
  return mapFeedback(token, { ...input, stars: null, comment: "", answeredAt: null, expiresAt, createdAt });
}

export async function getSessionFeedback(token: string) {
  const snapshot = await getDoc(doc(getFirebaseDb(), "sessionFeedbacks", token));
  if (!snapshot.exists()) return null;
  return mapFeedback(snapshot.id, snapshot.data());
}

export async function submitSessionFeedback(token: string, stars: number, comment: string) {
  const now = new Date();
  await updateDoc(doc(getFirebaseDb(), "sessionFeedbacks", token), {
    stars,
    comment: comment.trim(),
    answeredAt: now.toISOString(),
    answeredAtMillis: now.getTime(),
  });
}

function mapReportTemplate(id: string, data: DocumentData): ReportTemplate | null {
  const definition = parseTemplateDefinition(data.definition);
  if (!definition) return null;
  return {
    id,
    nome: text(data.nome) || "Modelo",
    definition,
    createdAt: text(data.createdAt),
    updatedAt: text(data.updatedAt),
  };
}

export async function listReportTemplates() {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) return [];
  const snapshot = await getDocs(query(collection(getFirebaseDb(), "reportTemplates"), where("ownerUid", "==", uid)));
  return snapshot.docs
    .map((item) => mapReportTemplate(item.id, item.data()))
    .filter((item): item is ReportTemplate => Boolean(item))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveReportTemplate(nome: string, definition: ReportDefinition, id?: string) {
  assertClinicWrite();
  const now = new Date().toISOString();
  const payload = { nome: nome.trim(), definition, ownerUid: currentOwnerUid(), updatedAt: now };
  if (id) {
    await updateDoc(doc(getFirebaseDb(), "reportTemplates", id), payload);
    return id;
  }
  const ref = await addDoc(collection(getFirebaseDb(), "reportTemplates"), { ...payload, createdAt: now });
  return ref.id;
}

export async function removeReportTemplate(id: string) {
  assertClinicWrite();
  await deleteDoc(doc(getFirebaseDb(), "reportTemplates", id));
}

export async function loadReportStore(): Promise<ReportStore> {
  const [patients, appointments, payments, expenses, packages, locations, members] = await Promise.all([
    listPatients(),
    listAppointments(),
    listPayments(),
    listExpenses(),
    listPackages(),
    listLocations(),
    listMembers(),
  ]);
  return { patients, appointments, payments, expenses, packages, locations, members };
}

function mapReportRun(id: string, data: DocumentData): ReportRun | null {
  const definition = parseTemplateDefinition(data.definition);
  if (!definition) return null;
  const pdf = mapAttachment(data.pdf);
  return {
    id,
    nome: text(data.nome) || "Relatório",
    definition,
    rowCount: Number(data.rowCount) || 0,
    pdf: pdf ? { ...pdf, mime: pdf.mime || "application/pdf" } : null,
    createdAt: text(data.createdAt),
  };
}

export async function listReportRuns() {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) return [];
  const snapshot = await getDocs(query(collection(getFirebaseDb(), "reportRuns"), where("ownerUid", "==", uid)));
  return snapshot.docs
    .map((item) => mapReportRun(item.id, item.data()))
    .filter((item): item is ReportRun => Boolean(item))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createReportRun(input: { nome: string; definition: ReportDefinition; rowCount: number; pdf: ReportRun["pdf"] }) {
  assertClinicWrite();
  const now = new Date().toISOString();
  const ref = await addDoc(collection(getFirebaseDb(), "reportRuns"), {
    nome: input.nome.trim(),
    definition: input.definition,
    rowCount: input.rowCount,
    pdf: input.pdf,
    ownerUid: currentOwnerUid(),
    createdAt: now,
  });
  return ref.id;
}

export async function removeReportRun(id: string) {
  assertClinicWrite();
  await deleteDoc(doc(getFirebaseDb(), "reportRuns", id));
}

function mapContractVersion(value: unknown, index: number): ContractTemplateVersion | null {
  const data = (value ?? {}) as Partial<ContractTemplateVersion>;
  const conteudo = text(data.conteudo);
  if (!conteudo && !text(data.nome)) return null;
  return {
    id: text(data.id) || `versao-${index}`,
    versao: Number(data.versao) || index + 1,
    quando: text(data.quando),
    resumo: text(data.resumo) || "Versão",
    nome: text(data.nome) || "Modelo",
    conteudo,
  };
}

function mapContractTemplate(id: string, data: DocumentData): ContractTemplate | null {
  const conteudo = text(data.conteudo);
  if (!conteudo && !text(data.nome)) return null;
  const createdAt = text(data.createdAt);
  return {
    id,
    nome: text(data.nome) || "Modelo de contrato",
    conteudo,
    versao: Math.max(1, Number(data.versao) || 1),
    historico: Array.isArray(data.historico)
      ? data.historico.map(mapContractVersion).filter((item): item is ContractTemplateVersion => Boolean(item))
      : [],
    createdAt,
    updatedAt: text(data.updatedAt) || createdAt,
  };
}

export async function listContractTemplates() {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) return [];
  const snapshot = await getDocs(query(collection(getFirebaseDb(), "contractTemplates"), where("ownerUid", "==", uid)));
  return snapshot.docs
    .map((item) => mapContractTemplate(item.id, item.data()))
    .filter((item): item is ContractTemplate => Boolean(item))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getContractTemplate(id: string) {
  const snapshot = await getDoc(doc(getFirebaseDb(), "contractTemplates", id));
  if (!snapshot.exists()) return null;
  return mapContractTemplate(snapshot.id, snapshot.data());
}

export async function writeContractTemplate(input: { nome: string; conteudo: string }, id?: string) {
  assertClinicWrite();
  const now = new Date().toISOString();
  const nome = input.nome.trim() || "Modelo de contrato";
  const conteudo = input.conteudo;
  if (!id) {
    const historico: ContractTemplateVersion[] = [
      { id: crypto.randomUUID(), versao: 1, quando: now, resumo: "Criação do modelo", nome, conteudo },
    ];
    const ref = await addDoc(collection(getFirebaseDb(), "contractTemplates"), {
      nome,
      conteudo,
      versao: 1,
      historico,
      ownerUid: currentOwnerUid(),
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  }
  const current = await getContractTemplate(id);
  if (!current) throw new Error("Modelo de contrato não encontrado.");
  if (current.nome === nome && current.conteudo === conteudo) {
    await updateDoc(doc(getFirebaseDb(), "contractTemplates", id), { updatedAt: now });
    return id;
  }
  const versao = current.versao + 1;
  const entry: ContractTemplateVersion = {
    id: crypto.randomUUID(),
    versao,
    quando: now,
    resumo: contractVersionSummary(current, { nome, conteudo }),
    nome,
    conteudo,
  };
  await updateDoc(doc(getFirebaseDb(), "contractTemplates", id), {
    nome,
    conteudo,
    versao,
    historico: [...current.historico, entry],
    updatedAt: now,
  });
  return id;
}

export async function removeContractTemplate(id: string) {
  assertClinicWrite();
  await deleteDoc(doc(getFirebaseDb(), "contractTemplates", id));
}

