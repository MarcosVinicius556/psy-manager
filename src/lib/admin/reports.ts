import { expenseTypeLabel, intervalLabel } from "./expenses";
import {
  formatDate,
  formatMoney,
  labelAppointmentStatus,
  labelModality,
  labelMood,
  labelPatientStatus,
  labelPaymentMethod,
  labelPaymentStatus,
  labelSessionType,
  monthLabel,
  PAYMENT_METHOD_OPTIONS,
} from "./format";
import { packageTypeLabel } from "./packages";
import type {
  Appointment,
  CareLocation,
  ClinicMember,
  Expense,
  Patient,
  Payment,
  SessionPackage,
} from "./types";

export type EntityId = "patients" | "appointments" | "payments" | "expenses" | "packages" | "locations";
export type RefEntity = EntityId | "members";

export type FieldType = "text" | "enum" | "number" | "boolean" | "date" | "ref";

export type FilterOp = "eq" | "neq" | "contains" | "in" | "gt" | "gte" | "lt" | "lte" | "between" | "month" | "period" | "empty" | "not_empty";

export type FilterKind = "field" | "relation";

export type RelationMode = "some" | "none";

export type ReportField = {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  refEntity?: RefEntity;
  money?: boolean;
};

export type FilterClause = {
  id: string;
  kind: FilterKind;
  field: string;
  op: FilterOp;
  value: string;
  value2: string;
  values: string[];
  relationEntity: EntityId | "";
  relationMode: RelationMode;
  children: FilterClause[];
};

export type ReportDefinition = {
  entity: EntityId;
  filters: FilterClause[];
  columns: string[];
  sortField: string;
  sortDir: "asc" | "desc";
};

export type ReportTemplate = {
  id: string;
  nome: string;
  definition: ReportDefinition;
  createdAt: string;
  updatedAt: string;
};

export type ReportRun = {
  id: string;
  nome: string;
  definition: ReportDefinition;
  rowCount: number;
  pdf: { id: string; nome: string; url: string; mime: string } | null;
  createdAt: string;
};

export type ReportResult = {
  headers: string[];
  table: string[][];
  count: number;
  columns: string[];
};

export type ReportStore = {
  patients: Patient[];
  appointments: Appointment[];
  payments: Payment[];
  expenses: Expense[];
  packages: SessionPackage[];
  locations: CareLocation[];
  members: ClinicMember[];
};

export type ReportRow = Record<string, unknown>;

const PATIENT_STATUS = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
];

const APPOINTMENT_STATUS = [
  { value: "agendado", label: "Agendado" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
  { value: "faltou", label: "Faltou" },
];

const SESSION_TYPES = [
  { value: "conhecimento", label: "Sessão de conhecimento" },
  { value: "padrao", label: "Sessão padrão" },
  { value: "emergencial", label: "Sessão emergencial" },
  { value: "alta", label: "Sessão de alta" },
];

const MODALITIES = [
  { value: "online", label: "Online" },
  { value: "presencial", label: "Presencial" },
];

const MOODS = [
  { value: "calma", label: "Calma" },
  { value: "estavel", label: "Estável" },
  { value: "ansioso", label: "Ansioso" },
  { value: "triste", label: "Triste" },
  { value: "irritado", label: "Irritado" },
];

const PAYMENT_STATUS = [
  { value: "agendado", label: "Agendado" },
  { value: "em_haver", label: "Em haver" },
  { value: "pago", label: "Pago" },
  { value: "nao_pago", label: "Não pago" },
];

const PAYMENT_ORIGIN = [
  { value: "paciente", label: "Paciente" },
  { value: "externo", label: "Externo" },
];

const EXPENSE_TYPES = [
  { value: "fixo", label: "Fixa" },
  { value: "variavel", label: "Variável" },
  { value: "parcelada", label: "Parcelada" },
];

const INTERVALS = [
  { value: "semanal", label: "Semanal" },
  { value: "mensal", label: "Mensal" },
  { value: "anual", label: "Anual" },
];

const PACKAGE_TYPES = [
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
  { value: "personalizado", label: "Personalizado" },
];

const YES_NO = [
  { value: "true", label: "Sim" },
  { value: "false", label: "Não" },
];

type RelationSpec = {
  entity: EntityId;
  label: string;
  match: (parent: ReportRow, child: ReportRow) => boolean;
};

export const ENTITY_OPTIONS: { value: EntityId; label: string }[] = [
  { value: "patients", label: "Pacientes" },
  { value: "appointments", label: "Atendimentos" },
  { value: "payments", label: "Contas a receber" },
  { value: "expenses", label: "Contas a pagar" },
  { value: "packages", label: "Pacotes" },
  { value: "locations", label: "Locais" },
];

const FIELDS: Record<EntityId, ReportField[]> = {
  patients: [
    { key: "nome", label: "Nome", type: "text" },
    { key: "status", label: "Status", type: "enum", options: PATIENT_STATUS },
    { key: "cpf", label: "CPF", type: "text" },
    { key: "nascimento", label: "Nascimento", type: "date" },
    { key: "telefone", label: "Telefone", type: "text" },
    { key: "email", label: "E-mail", type: "text" },
    { key: "endereco", label: "Endereço", type: "text" },
    { key: "contatoEmergencia", label: "Contato de emergência", type: "text" },
    { key: "observacoes", label: "Observações", type: "text" },
    { key: "temContrato", label: "Contrato assinado", type: "boolean" },
    { key: "createdAt", label: "Cadastrado em", type: "date" },
  ],
  appointments: [
    { key: "date", label: "Data", type: "date" },
    { key: "startTime", label: "Início", type: "text" },
    { key: "endTime", label: "Fim", type: "text" },
    { key: "status", label: "Status da sessão", type: "enum", options: APPOINTMENT_STATUS },
    { key: "sessionType", label: "Tipo de sessão", type: "enum", options: SESSION_TYPES },
    { key: "modality", label: "Modalidade", type: "enum", options: MODALITIES },
    { key: "valor", label: "Valor", type: "number", money: true },
    { key: "valorSocial", label: "Valor social", type: "boolean" },
    { key: "patientId", label: "Paciente", type: "ref", refEntity: "patients" },
    { key: "patient.status", label: "Status do paciente", type: "enum", options: PATIENT_STATUS },
    { key: "professionalId", label: "Profissional", type: "ref", refEntity: "members" },
    { key: "locationId", label: "Local", type: "ref", refEntity: "locations" },
    { key: "packageId", label: "Pacote", type: "ref", refEntity: "packages" },
    { key: "mood", label: "Humor", type: "enum", options: MOODS },
    { key: "faltaJustificativa", label: "Justificativa da falta", type: "text" },
    { key: "recurring", label: "Recorrente", type: "boolean" },
  ],
  payments: [
    { key: "descricao", label: "Descrição", type: "text" },
    { key: "status", label: "Status", type: "enum", options: PAYMENT_STATUS },
    { key: "origem", label: "Origem", type: "enum", options: PAYMENT_ORIGIN },
    { key: "valor", label: "Valor", type: "number", money: true },
    { key: "valorAcordado", label: "Valor acordado", type: "number", money: true },
    { key: "dueDate", label: "Vencimento", type: "date" },
    { key: "paidAt", label: "Pago em", type: "date" },
    { key: "formaPagamento", label: "Forma de pagamento", type: "enum", options: PAYMENT_METHOD_OPTIONS },
    { key: "patientId", label: "Paciente", type: "ref", refEntity: "patients" },
    { key: "packageId", label: "Pacote", type: "ref", refEntity: "packages" },
    { key: "recorrente", label: "Recorrente", type: "boolean" },
  ],
  expenses: [
    { key: "descricao", label: "Descrição", type: "text" },
    { key: "tipo", label: "Tipo", type: "enum", options: EXPENSE_TYPES },
    { key: "valor", label: "Valor", type: "number", money: true },
    { key: "competencia", label: "Competência", type: "date" },
    { key: "vencimento", label: "Vencimento", type: "date" },
    { key: "paga", label: "Paga", type: "boolean" },
    { key: "locationId", label: "Local", type: "ref", refEntity: "locations" },
    { key: "intervalo", label: "Intervalo", type: "enum", options: INTERVALS },
    { key: "parcelas", label: "Parcelas", type: "number" },
    { key: "observacoes", label: "Observações", type: "text" },
  ],
  packages: [
    { key: "nome", label: "Nome", type: "text" },
    { key: "tipo", label: "Tipo", type: "enum", options: PACKAGE_TYPES },
    { key: "valorSessao", label: "Valor da sessão", type: "number", money: true },
    { key: "sessoes", label: "Sessões", type: "number" },
    { key: "arquivado", label: "Arquivado", type: "boolean" },
    { key: "observacoes", label: "Observações", type: "text" },
    { key: "createdAt", label: "Criado em", type: "date" },
  ],
  locations: [
    { key: "nome", label: "Nome", type: "text" },
    { key: "endereco", label: "Endereço", type: "text" },
    { key: "observacoes", label: "Observações", type: "text" },
    { key: "createdAt", label: "Cadastrado em", type: "date" },
  ],
};

const RELATIONS: Record<EntityId, RelationSpec[]> = {
  patients: [
    { entity: "appointments", label: "Atendimentos", match: (parent, child) => child.patientId === parent.id },
    { entity: "payments", label: "Contas a receber", match: (parent, child) => child.patientId === parent.id },
  ],
  appointments: [{ entity: "payments", label: "Contas a receber", match: (parent, child) => child.appointmentId === parent.id }],
  payments: [],
  expenses: [],
  packages: [{ entity: "appointments", label: "Atendimentos", match: (parent, child) => child.packageId === parent.id }],
  locations: [
    { entity: "appointments", label: "Atendimentos", match: (parent, child) => child.locationId === parent.id },
    { entity: "expenses", label: "Contas a pagar", match: (parent, child) => child.locationId === parent.id },
  ],
};

const OPS: Record<FieldType, { value: FilterOp; label: string }[]> = {
  text: [
    { value: "contains", label: "contém" },
    { value: "eq", label: "é" },
    { value: "neq", label: "não é" },
    { value: "empty", label: "está vazio" },
    { value: "not_empty", label: "está preenchido" },
  ],
  enum: [
    { value: "eq", label: "é" },
    { value: "neq", label: "não é" },
    { value: "in", label: "é um de" },
  ],
  number: [
    { value: "eq", label: "é" },
    { value: "neq", label: "não é" },
    { value: "gt", label: "maior que" },
    { value: "gte", label: "maior ou igual" },
    { value: "lt", label: "menor que" },
    { value: "lte", label: "menor ou igual" },
    { value: "between", label: "entre" },
  ],
  boolean: [{ value: "eq", label: "é" }],
  date: [
    { value: "eq", label: "é" },
    { value: "gte", label: "a partir de" },
    { value: "lte", label: "até" },
    { value: "between", label: "entre" },
    { value: "month", label: "no mês" },
    { value: "period", label: "no mês/ano" },
    { value: "empty", label: "está vazio" },
    { value: "not_empty", label: "está preenchido" },
  ],
  ref: [
    { value: "eq", label: "é" },
    { value: "neq", label: "não é" },
    { value: "empty", label: "está vazio" },
    { value: "not_empty", label: "está preenchido" },
  ],
};

const DEFAULT_COLUMNS: Record<EntityId, string[]> = {
  patients: ["nome", "status", "telefone", "email"],
  appointments: ["date", "startTime", "patientId", "sessionType", "status", "valor"],
  payments: ["dueDate", "descricao", "patientId", "status", "valor"],
  expenses: ["vencimento", "descricao", "tipo", "valor", "paga"],
  packages: ["nome", "tipo", "valorSessao", "sessoes", "arquivado"],
  locations: ["nome", "endereco"],
};

export function entityLabel(entity: EntityId) {
  return ENTITY_OPTIONS.find((item) => item.value === entity)?.label ?? entity;
}

export function fieldsOf(entity: EntityId) {
  return FIELDS[entity];
}

export function relationsOf(entity: EntityId) {
  return RELATIONS[entity];
}

export function operatorsOf(type: FieldType) {
  return OPS[type];
}

export function fieldOf(entity: EntityId, key: string) {
  return FIELDS[entity].find((item) => item.key === key);
}

export function emptyFilter(kind: FilterKind = "field"): FilterClause {
  return {
    id: crypto.randomUUID(),
    kind,
    field: "",
    op: "eq",
    value: "",
    value2: "",
    values: [],
    relationEntity: "",
    relationMode: "some",
    children: [],
  };
}

export function defaultDefinition(entity: EntityId = "patients"): ReportDefinition {
  const columns = [...DEFAULT_COLUMNS[entity]];
  return { entity, filters: [], columns, sortField: columns[0] ?? "", sortDir: "asc" };
}

export function cloneDefinition(definition: ReportDefinition): ReportDefinition {
  return JSON.parse(JSON.stringify(definition)) as ReportDefinition;
}

function getValue(row: ReportRow, key: string): unknown {
  return key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object") return (current as ReportRow)[part];
    return undefined;
  }, row);
}

function asText(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && "nome" in value) return String((value as { nome?: string }).nome ?? "");
  return "";
}

function padDate(value: number) {
  return String(value).padStart(2, "0");
}

function parseDate(value: unknown): { year: number; month: number; day: number } | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() };
  }
  const text = asText(value).trim();
  if (!text) return null;
  const iso = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?(?:[T\s].*)?$/.exec(text);
  if (iso) {
    const month = Number(iso[2]);
    if (month < 1 || month > 12) return null;
    return { year: Number(iso[1]), month, day: Number(iso[3] || 1) };
  }
  const br = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:\s.*)?$/.exec(text);
  if (br) {
    let day = Number(br[1]);
    let month = Number(br[2]);
    if (month > 12 && day <= 12) {
      const swap = day;
      day = month;
      month = swap;
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { year: Number(br[3]), month, day };
  }
  return null;
}

function datePart(value: unknown) {
  const parsed = parseDate(value);
  if (!parsed) return asText(value).slice(0, 10);
  return `${parsed.year}-${padDate(parsed.month)}-${padDate(parsed.day)}`;
}

function monthName(month: number) {
  return new Date(2000, month - 1, 1).toLocaleDateString("pt-BR", { month: "long" });
}

function asNumber(value: unknown) {
  if (typeof value === "number") return value;
  const parsed = Number(asText(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function isEmpty(value: unknown) {
  if (value == null) return true;
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return false;
  return asText(value).trim() === "";
}

function matchesField(row: ReportRow, clause: FilterClause, field: ReportField | undefined) {
  if (!clause.field || !field) return true;
  const raw = getValue(row, clause.field);
  if (clause.op === "empty") return isEmpty(raw);
  if (clause.op === "not_empty") return !isEmpty(raw);
  if (clause.op === "in") {
    if (clause.values.length === 0) return true;
    return clause.values.includes(asText(raw));
  }
  if (field.type === "boolean") {
    if (clause.value === "") return true;
    return Boolean(raw) === (clause.value === "true");
  }
  if (field.type === "number") {
    const left = asNumber(raw);
    const right = asNumber(clause.value);
    const right2 = asNumber(clause.value2);
    if (clause.value === "") return true;
    if (!Number.isFinite(left)) return false;
    if (clause.op === "eq") return left === right;
    if (clause.op === "neq") return left !== right;
    if (clause.op === "gt") return left > right;
    if (clause.op === "gte") return left >= right;
    if (clause.op === "lt") return left < right;
    if (clause.op === "lte") return left <= right;
    if (clause.op === "between") return Number.isFinite(right2) && left >= right && left <= right2;
    return true;
  }
  if (field.type === "date") {
    if (clause.value === "") return true;
    const left = parseDate(raw);
    const right = parseDate(clause.value.length === 7 ? `${clause.value}-01` : clause.value);
    if (!left || !right) return false;
    const leftDay = datePart(raw);
    const rightDay = `${right.year}-${padDate(right.month)}-${padDate(right.day)}`;
    if (clause.op === "month") return left.month === right.month;
    if (clause.op === "period") return left.year === right.year && left.month === right.month;
    if (clause.op === "eq") return leftDay === datePart(clause.value);
    if (clause.op === "gte") return leftDay >= rightDay;
    if (clause.op === "lte") return leftDay <= rightDay;
    if (clause.op === "between") {
      const end = parseDate(clause.value2.length === 7 ? `${clause.value2}-01` : clause.value2);
      if (!end) return false;
      const endDay = `${end.year}-${padDate(end.month)}-${padDate(end.day)}`;
      return leftDay >= rightDay && leftDay <= endDay;
    }
    return true;
  }
  const left = asText(raw).trim().toLowerCase();
  const right = clause.value.trim().toLowerCase();
  if (clause.op === "contains") return !right || left.includes(right);
  if (clause.op === "eq") return !clause.value || left === right;
  if (clause.op === "neq") return !clause.value || left !== right;
  return true;
}

function matchesClause(row: ReportRow, clause: FilterClause, entity: EntityId, rowsOf: (id: EntityId) => ReportRow[]): boolean {
  if (clause.kind === "relation") {
    if (!clause.relationEntity) return true;
    const spec = RELATIONS[entity].find((item) => item.entity === clause.relationEntity);
    if (!spec) return true;
    const related = rowsOf(spec.entity).filter((child) => spec.match(row, child));
    const hits = related.filter((child) => clause.children.every((childClause) => matchesClause(child, childClause, spec.entity, rowsOf)));
    return clause.relationMode === "none" ? hits.length === 0 : hits.length > 0;
  }
  return matchesField(row, clause, fieldOf(entity, clause.field));
}

function byId<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

function buildRows(entity: EntityId, store: ReportStore): ReportRow[] {
  const patients = byId(store.patients);
  const members = byId(store.members);
  const locations = byId(store.locations);
  const packages = byId(store.packages);
  if (entity === "patients") {
    return store.patients.map((item) => ({
      ...item,
      temContrato: Boolean(item.contratoAssinado?.url),
    }));
  }
  if (entity === "appointments") {
    return store.appointments.map((item) => ({
      ...item,
      mood: item.clinical.mood,
      patient: patients.get(item.patientId) ?? null,
      professional: item.professionalId ? members.get(item.professionalId) ?? null : null,
      location: item.locationId ? locations.get(item.locationId) ?? null : null,
      package: item.packageId ? packages.get(item.packageId) ?? null : null,
    }));
  }
  if (entity === "payments") {
    return store.payments.map((item) => ({
      ...item,
      patient: item.patientId ? patients.get(item.patientId) ?? null : null,
      package: item.packageId ? packages.get(item.packageId) ?? null : null,
    }));
  }
  if (entity === "expenses") {
    return store.expenses.map((item) => ({
      ...item,
      location: item.locationId ? locations.get(item.locationId) ?? null : null,
    }));
  }
  if (entity === "packages") return store.packages.map((item) => ({ ...item }));
  return store.locations.map((item) => ({ ...item }));
}

function refName(store: ReportStore, refEntity: RefEntity | undefined, id: string) {
  if (!id) return "";
  if (refEntity === "patients") return store.patients.find((item) => item.id === id)?.nome ?? "";
  if (refEntity === "locations") return store.locations.find((item) => item.id === id)?.nome ?? "";
  if (refEntity === "packages") return store.packages.find((item) => item.id === id)?.nome ?? "";
  if (refEntity === "members") return store.members.find((item) => item.id === id)?.nome ?? "";
  return id;
}

export function refOptions(store: ReportStore, refEntity: RefEntity | undefined) {
  if (refEntity === "patients") return store.patients.map((item) => ({ value: item.id, label: item.nome }));
  if (refEntity === "locations") return store.locations.map((item) => ({ value: item.id, label: item.nome }));
  if (refEntity === "packages") return store.packages.map((item) => ({ value: item.id, label: item.nome }));
  if (refEntity === "members") return store.members.map((item) => ({ value: item.id, label: item.nome }));
  return [];
}

function formatCell(field: ReportField | undefined, value: unknown, store: ReportStore) {
  if (field?.type === "boolean") return value ? "Sim" : "Não";
  if (field?.money) return formatMoney(asNumber(value) || 0);
  if (field?.type === "date") {
    const part = datePart(value);
    return part ? formatDate(part) : "—";
  }
  if (field?.type === "ref") return refName(store, field.refEntity, asText(value)) || "—";
  if (field?.type === "enum") {
    const text = asText(value);
    if (!text) return "—";
    if (field.key === "status" && field.options === PATIENT_STATUS) return labelPatientStatus(text as Patient["status"]);
    if (field.options === APPOINTMENT_STATUS) return labelAppointmentStatus(text as Appointment["status"]);
    if (field.options === SESSION_TYPES) return labelSessionType(text as Appointment["sessionType"]);
    if (field.options === MODALITIES) return labelModality(text as Appointment["modality"]);
    if (field.options === MOODS) return labelMood(text as Appointment["clinical"]["mood"]);
    if (field.options === PAYMENT_STATUS) return labelPaymentStatus(text as Payment["status"]);
    if (field.options === PAYMENT_METHOD_OPTIONS) return labelPaymentMethod(text as Payment["formaPagamento"]);
    if (field.options === EXPENSE_TYPES) return expenseTypeLabel(text as Expense["tipo"]);
    if (field.options === INTERVALS) return text ? intervalLabel(text as "semanal" | "mensal" | "anual") : "—";
    if (field.options === PACKAGE_TYPES) return packageTypeLabel(text as SessionPackage["tipo"]);
    return field.options?.find((item) => item.value === text)?.label ?? text;
  }
  const text = asText(value);
  return text || "—";
}

export function runReport(definition: ReportDefinition, store: ReportStore) {
  const cache = new Map<EntityId, ReportRow[]>();
  const rowsOf = (entity: EntityId) => {
    const hit = cache.get(entity);
    if (hit) return hit;
    const built = buildRows(entity, store);
    cache.set(entity, built);
    return built;
  };
  const entity = definition.entity;
  const columns = (definition.columns.length ? definition.columns : DEFAULT_COLUMNS[entity]).filter((key) => fieldOf(entity, key));
  let rows = rowsOf(entity).filter((row) => definition.filters.every((clause) => matchesClause(row, clause, entity, rowsOf)));
  const sortField = definition.sortField || columns[0] || "";
  const sortDir = definition.sortDir === "desc" ? -1 : 1;
  if (sortField) {
    const field = fieldOf(entity, sortField);
    rows = [...rows].sort((a, b) => {
      const left = getValue(a, sortField);
      const right = getValue(b, sortField);
      if (field?.type === "number") return ((asNumber(left) || 0) - (asNumber(right) || 0)) * sortDir;
      if (field?.type === "boolean") return (Number(Boolean(left)) - Number(Boolean(right))) * sortDir;
      if (field?.type === "date") return datePart(left).localeCompare(datePart(right)) * sortDir;
      if (field?.type === "ref") return refName(store, field.refEntity, asText(left)).localeCompare(refName(store, field.refEntity, asText(right)), "pt-BR") * sortDir;
      return asText(left).localeCompare(asText(right), "pt-BR") * sortDir;
    });
  }
  const headers = columns.map((key) => fieldOf(entity, key)?.label ?? key);
  const table = rows.map((row) => columns.map((key) => formatCell(fieldOf(entity, key), getValue(row, key), store)));
  return { headers, table, count: table.length, columns };
}

function describeFieldClause(entity: EntityId, clause: FilterClause) {
  const field = fieldOf(entity, clause.field);
  if (!field) return "";
  const op = operatorsOf(field.type).find((item) => item.value === clause.op)?.label ?? clause.op;
  if (clause.op === "empty" || clause.op === "not_empty") return `${field.label} ${op}`;
  if (clause.op === "in") {
    const labels = clause.values.map((value) => field.options?.find((item) => item.value === value)?.label ?? value);
    return `${field.label} ${op} ${labels.join(", ") || "…"}`;
  }
  if (clause.op === "month") {
    const parsed = parseDate(clause.value.length === 7 ? `${clause.value}-01` : clause.value);
    return `${field.label} ${op} ${parsed ? monthName(parsed.month) : "…"}`;
  }
  if (clause.op === "period") return `${field.label} ${op} ${clause.value ? monthLabel(clause.value.slice(0, 7)) : "…"}`;
  if (clause.op === "between") return `${field.label} ${op} ${clause.value || "…"} e ${clause.value2 || "…"}`;
  if (field.type === "boolean") return `${field.label} ${op} ${clause.value === "false" ? "Não" : clause.value === "true" ? "Sim" : "…"}`;
  if (field.type === "enum") return `${field.label} ${op} ${field.options?.find((item) => item.value === clause.value)?.label ?? (clause.value || "…")}`;
  return `${field.label} ${op} ${clause.value || "…"}`;
}

function describeClause(entity: EntityId, clause: FilterClause): string {
  if (clause.kind === "relation") {
    const spec = RELATIONS[entity].find((item) => item.entity === clause.relationEntity);
    const mode = clause.relationMode === "none" ? "não possui" : "possui";
    const inner = clause.children.map((child) => describeClause(clause.relationEntity || entity, child)).filter(Boolean);
    return `${mode} ${spec?.label ?? "relação"}${inner.length ? ` (${inner.join(" e ")})` : ""}`;
  }
  return describeFieldClause(entity, clause);
}

export function describeReport(definition: ReportDefinition) {
  const base = entityLabel(definition.entity);
  const parts = definition.filters.map((clause) => describeClause(definition.entity, clause)).filter(Boolean);
  if (parts.length === 0) return `${base} sem filtros`;
  return `${base} onde ${parts.join(" e ")}`;
}

export function reportCsv(headers: string[], table: string[][]) {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const lines = [headers, ...table].map((row) => row.map(escape).join(";"));
  return `\uFEFF${lines.join("\n")}`;
}

export function reportFileSlug(nome: string) {
  return nome.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "relatorio";
}

export function downloadCsv(nome: string, headers: string[], table: string[][]) {
  const blob = new Blob([reportCsv(headers, table)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${reportFileSlug(nome)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadPdfBlob(blob: Blob, nome: string) {
  const file = new Blob([blob], { type: "application/pdf" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${reportFileSlug(nome)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function clinicPdfHref(url: string, nome = "relatorio.pdf") {
  const filename = nome.toLowerCase().endsWith(".pdf") ? nome : `${nome}.pdf`;
  return `/api/pdf?url=${encodeURIComponent(url)}&name=${encodeURIComponent(filename)}`;
}

export async function createReportPdf(input: {
  nome: string;
  description: string;
  generatedAt: string;
  headers: string[];
  table: string[][];
}) {
  const { jsPDF } = await import("jspdf");
  const landscape = input.headers.length > 5;
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: landscape ? "landscape" : "portrait", compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const usable = pageWidth - margin * 2;
  const bottom = pageHeight - 14;
  const ink: [number, number, number] = [36, 48, 40];
  const teal: [number, number, number] = [61, 82, 64];
  const muted: [number, number, number] = [90, 103, 92];
  const head: [number, number, number] = [231, 240, 229];
  const line: [number, number, number] = [215, 224, 216];
  const columns = Math.max(1, input.headers.length);
  const colWidth = usable / columns;
  const fontSize = columns > 8 ? 7 : columns > 5 ? 8 : 9;
  let y = 18;

  doc.setProperties({ title: input.nome, subject: input.description });

  function ensure(height: number) {
    if (y + height <= bottom) return;
    doc.addPage();
    y = 16;
  }

  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.setTextColor(teal[0], teal[1], teal[2]);
  doc.text(input.nome, margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  const summary = doc.splitTextToSize(`${input.description} · gerado em ${input.generatedAt}`, usable);
  doc.text(summary, margin, y);
  y += summary.length * 4.2 + 6;

  function drawHeader() {
    const wraps = input.headers.map((header) => doc.splitTextToSize(header, colWidth - 3));
    const height = Math.max(8, ...wraps.map((lines) => lines.length * 3.6 + 4));
    ensure(height);
    doc.setFillColor(head[0], head[1], head[2]);
    doc.rect(margin, y, usable, height, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontSize);
    doc.setTextColor(teal[0], teal[1], teal[2]);
    wraps.forEach((lines, index) => {
      doc.text(lines, margin + colWidth * index + 1.5, y + 4.2);
    });
    y += height;
  }

  drawHeader();

  if (input.table.length === 0) {
    ensure(10);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.text("Nenhum registro encontrado para esta consulta.", margin, y + 6);
  } else {
    input.table.forEach((row, rowIndex) => {
      const wraps = row.map((cell) => doc.splitTextToSize(cell || "—", colWidth - 3));
      const height = Math.max(7, ...wraps.map((lines) => lines.length * 3.5 + 3.2));
      if (y + height > bottom) {
        doc.addPage();
        y = 16;
        drawHeader();
      }
      if (rowIndex % 2 === 1) {
        doc.setFillColor(244, 247, 242);
        doc.rect(margin, y, usable, height, "F");
      }
      doc.setDrawColor(line[0], line[1], line[2]);
      doc.line(margin, y + height, margin + usable, y + height);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize);
      doc.setTextColor(ink[0], ink[1], ink[2]);
      wraps.forEach((lines, index) => {
        doc.text(lines, margin + colWidth * index + 1.5, y + 4);
      });
      y += height;
    });
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.text(`Psy Manager · ${input.nome}`, margin, pageHeight - 8);
    doc.text(`${page} / ${pages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  const buffer = doc.output("arraybuffer");
  const bytes = new Uint8Array(buffer);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: "application/pdf" });
}

export function parseTemplateDefinition(value: unknown): ReportDefinition | null {
  const data = (value ?? {}) as Partial<ReportDefinition>;
  if (!ENTITY_OPTIONS.some((item) => item.value === data.entity)) return null;
  const entity = data.entity as EntityId;
  const filters = Array.isArray(data.filters) ? data.filters.map(parseClause).filter((item): item is FilterClause => Boolean(item)) : [];
  const columns = Array.isArray(data.columns) ? data.columns.filter((item): item is string => typeof item === "string") : [...DEFAULT_COLUMNS[entity]];
  return {
    entity,
    filters,
    columns: columns.length ? columns : [...DEFAULT_COLUMNS[entity]],
    sortField: typeof data.sortField === "string" ? data.sortField : columns[0] ?? "",
    sortDir: data.sortDir === "desc" ? "desc" : "asc",
  };
}

function parseClause(value: unknown): FilterClause | null {
  const data = (value ?? {}) as Partial<FilterClause>;
  const kind = data.kind === "relation" ? "relation" : "field";
  return {
    id: typeof data.id === "string" && data.id ? data.id : crypto.randomUUID(),
    kind,
    field: typeof data.field === "string" ? data.field : "",
    op: typeof data.op === "string" ? (data.op as FilterOp) : "eq",
    value: typeof data.value === "string" ? data.value : "",
    value2: typeof data.value2 === "string" ? data.value2 : "",
    values: Array.isArray(data.values) ? data.values.filter((item): item is string => typeof item === "string") : [],
    relationEntity: data.relationEntity && ENTITY_OPTIONS.some((item) => item.value === data.relationEntity) ? data.relationEntity : "",
    relationMode: data.relationMode === "none" ? "none" : "some",
    children: Array.isArray(data.children) ? data.children.map(parseClause).filter((item): item is FilterClause => Boolean(item)) : [],
  };
}
