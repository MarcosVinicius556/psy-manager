import type {
  AppointmentConfirmationStatus,
  AppointmentStatus,
  Modality,
  Mood,
  PatientStatus,
  PaymentMethod,
  PaymentStatus,
  SessionType,
} from "./types";

export function todayISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDate(iso: string) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

export function moneyInput(value: number) {
  if (!value) return "";
  return String(value).replace(".", ",");
}

export function parseMoney(value: string) {
  const amount = Number(value.replace(",", "."));
  return Number.isFinite(amount) ? amount : 0;
}

export function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function shiftMonth(iso: string, delta: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const target = new Date(year, month - 1 + delta, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day || 1, last));
  return todayISO(target);
}

export function monthlyDates(start: string, until: string, limit = 36) {
  if (!start || !until || until < start) return [];
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= until && dates.length < limit) {
    dates.push(cursor);
    const next = shiftMonth(cursor, 1);
    if (next <= cursor) break;
    cursor = next;
  }
  return dates;
}

export function addMonths(isoMonth: string, delta: number) {
  const [year, month] = isoMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(isoMonth: string) {
  const [year, month] = isoMonth.split("-").map(Number);
  const label = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return label.toLocaleLowerCase("pt-BR");
}

export function buildMonthCells(isoMonth: string) {
  const [year, month] = isoMonth.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const startPad = (first.getDay() + 6) % 7;
  const days = new Date(year, month, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: startPad }, () => null);
  for (let day = 1; day <= days; day += 1) {
    cells.push(
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    );
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function shiftDate(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day + days);
  return todayISO(date);
}

export function startOfWeek(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return todayISO(date);
}

const patientStatusLabel: Record<PatientStatus, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
};

/** Normalizes legacy Firestore shapes (`ativo` boolean, English labels) into clinic status. */
export function normalizePatientStatus(data: { status?: unknown; ativo?: unknown }): PatientStatus {
  const raw = String(data.status ?? "").trim().toLowerCase();
  if (raw === "inativo" || raw === "inactive" || raw === "disabled" || raw === "false") return "inativo";
  if (raw === "ativo" || raw === "active") return "ativo";
  if (data.ativo === false) return "inativo";
  return "ativo";
}

export function isPatientActive(patient: { status: PatientStatus }): boolean {
  return patient.status === "ativo";
}

const appointmentConfirmationLabel: Record<AppointmentConfirmationStatus, string> = {
  pendente: "Aguardando confirmação",
  confirmada: "Confirmada",
  remarcar: "Pediu remarcação",
};

export function labelAppointmentConfirmation(status: AppointmentConfirmationStatus | null | undefined) {
  if (!status) return null;
  return appointmentConfirmationLabel[status] ?? null;
}

const appointmentStatusLabel: Record<AppointmentStatus, string> = {
  agendado: "Agendado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  faltou: "Faltou",
};

const modalityLabel: Record<Modality, string> = {
  online: "Online",
  presencial: "Presencial",
};

const sessionTypeLabel: Record<SessionType, string> = {
  conhecimento: "Sessão de conhecimento",
  padrao: "Sessão padrão",
  emergencial: "Sessão emergencial",
  alta: "Sessão de alta",
};

const moodLabel: Record<Mood, string> = {
  calma: "Calma",
  ansioso: "Ansioso",
  triste: "Triste",
  irritado: "Irritado",
  estavel: "Estável",
};

const paymentStatusLabel: Record<PaymentStatus, string> = {
  agendado: "Agendado",
  em_haver: "Em haver",
  pago: "Pago",
  nao_pago: "Não pago",
};

function paymentMethodOptions<const T extends readonly { value: PaymentMethod; label: string }[]>(
  options: [Exclude<PaymentMethod, T[number]["value"]>] extends [never] ? T : never
): { value: PaymentMethod; label: string }[] {
  return options.map((item) => ({ value: item.value, label: item.label }));
}

export const PAYMENT_METHOD_OPTIONS = paymentMethodOptions([
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
  { value: "transferencia", label: "Transferência" },
  { value: "outro", label: "Outro" },
]);

export function labelPatientStatus(status: PatientStatus) {
  return patientStatusLabel[status];
}

export function labelAppointmentStatus(status: AppointmentStatus) {
  return appointmentStatusLabel[status];
}

export function labelModality(modality: Modality) {
  return modalityLabel[modality];
}

export function labelAppointmentPlace(modality: Modality, locationName: string | null | undefined) {
  const place = locationName?.trim() || "";
  if (modality === "online") return place ? `Online · ${place}` : "Online";
  return place || "Presencial";
}

export function labelSessionType(type: SessionType) {
  return sessionTypeLabel[type];
}

export function labelMood(mood: Mood | "") {
  if (!mood) return "Não informado";
  return moodLabel[mood];
}

export function labelPaymentStatus(status: PaymentStatus) {
  return paymentStatusLabel[status];
}

export function isPaymentMethod(value: string): value is PaymentMethod {
  return PAYMENT_METHOD_OPTIONS.some((item) => item.value === value);
}

export function labelPaymentMethod(method: PaymentMethod) {
  return PAYMENT_METHOD_OPTIONS.find((item) => item.value === method)?.label ?? method;
}

export const MOODS: Mood[] = ["calma", "estavel", "ansioso", "triste", "irritado"];

export const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export const WEEKDAY_OPTIONS = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];
