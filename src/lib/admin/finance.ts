import { attachmentHasMedia } from "@/lib/cloudinary/asset";
import type { ClinicAttachment, Patient, Payment, PaymentEvent, PaymentMethod, PaymentStatus } from "./types";
import { todayISO } from "./format";

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function agreedAmount(payment: Payment) {
  return roundMoney(payment.valorAcordado > 0 ? payment.valorAcordado : payment.valor);
}

export function receivedAmount(payment: Payment) {
  const received = payment.historico
    .filter((event) => event.tipo === "pagamento")
    .reduce((sum, event) => sum + event.valor, 0);
  if (received > 0) return roundMoney(received);
  if (payment.historico.length === 0 && payment.status === "pago") return agreedAmount(payment);
  return 0;
}

export function remainingAmount(payment: Payment) {
  return roundMoney(Math.max(0, agreedAmount(payment) - receivedAmount(payment)));
}

export function paymentHistory(payment: Payment): PaymentEvent[] {
  if (payment.historico.length > 0) return payment.historico;
  const agreed = agreedAmount(payment);
  const events: PaymentEvent[] = [
    {
      id: `${payment.id}-lancamento`,
      tipo: "lancamento",
      valor: agreed,
      data: payment.dueDate || payment.createdAt.slice(0, 10),
      formaPagamento: "",
      parcial: false,
      observacao: payment.descricao || "Lançamento",
      comprovante: null,
      createdAt: payment.createdAt,
    },
  ];
  if (payment.status === "pago") {
    events.push({
      id: `${payment.id}-pagamento`,
      tipo: "pagamento",
      valor: agreed,
      data: (payment.paidAt || payment.createdAt).slice(0, 10),
      formaPagamento: payment.formaPagamento,
      parcial: false,
      observacao: "Pagamento confirmado",
      comprovante: null,
      createdAt: payment.paidAt || payment.createdAt,
    });
  }
  if (payment.status === "nao_pago") {
    events.push({
      id: `${payment.id}-situacao`,
      tipo: "situacao",
      valor: 0,
      data: payment.dueDate,
      formaPagamento: "",
      parcial: false,
      observacao: "Marcado como não pago",
      comprovante: null,
      createdAt: payment.createdAt,
    });
  }
  return events;
}

export function paymentReceipts(payment: Payment): ClinicAttachment[] {
  return payment.historico.flatMap((event) => (event.comprovante && attachmentHasMedia(event.comprovante) ? [event.comprovante] : []));
}

export function receiptPatch(
  payment: Payment,
  input: { valor: number; formaPagamento: PaymentMethod; data: string; observacao: string; comprovante?: ClinicAttachment | null }
) {
  const agreed = agreedAmount(payment);
  const remaining = remainingAmount(payment);
  const amount = roundMoney(input.valor);
  if (payment.status === "nao_pago") throw new Error("Este lançamento foi marcado como não pago.");
  if (remaining <= 0) throw new Error("Este lançamento já está quitado.");
  if (amount <= 0) throw new Error("Informe o valor recebido.");
  if (roundMoney(amount - remaining) > 0) throw new Error("O valor recebido não pode passar do que falta.");
  const settled = roundMoney(remaining - amount) <= 0;
  const now = new Date().toISOString();
  const event: PaymentEvent = {
    id: crypto.randomUUID(),
    tipo: "pagamento",
    valor: amount,
    data: input.data || todayISO(),
    formaPagamento: input.formaPagamento,
    parcial: !settled,
    observacao: input.observacao.trim(),
    comprovante: input.comprovante && attachmentHasMedia(input.comprovante) ? input.comprovante : null,
    createdAt: now,
  };
  const previous = payment.historico.length > 0 ? payment.historico : paymentHistory(payment).filter((item) => item.tipo === "lancamento");
  const status: PaymentStatus = settled ? "pago" : "em_haver";
  return {
    historico: [...previous, event],
    valorAcordado: agreed,
    status,
    paidAt: settled ? now : null,
    formaPagamento: input.formaPagamento,
    parcial: !settled,
    faltante: roundMoney(remaining - amount),
  };
}

export function unpaidPatch(payment: Payment) {
  const now = new Date().toISOString();
  const previous = payment.historico.length > 0 ? payment.historico : paymentHistory(payment).filter((event) => event.tipo === "lancamento");
  const event: PaymentEvent = {
    id: crypto.randomUUID(),
    tipo: "situacao",
    valor: 0,
    data: todayISO(),
    formaPagamento: "",
    parcial: false,
    observacao: "Marcado como não pago",
    comprovante: null,
    createdAt: now,
  };
  return {
    historico: [...previous, event],
    valorAcordado: agreedAmount(payment),
    status: "nao_pago" as PaymentStatus,
    paidAt: null,
  };
}

function isOpenReceivable(payment: Payment) {
  return payment.status === "agendado" || payment.status === "em_haver";
}

export function isOverdue(payment: Payment, today = todayISO()) {
  return payment.status === "em_haver" && payment.dueDate < today;
}

export function isUnpaid(payment: Payment, today = todayISO()) {
  return payment.status === "nao_pago" || isOverdue(payment, today);
}

export function isExternalPayment(payment: Payment) {
  return payment.origem === "externo";
}

export function isFutureLaunch(payment: Payment, today = todayISO()) {
  return isOpenReceivable(payment) && payment.dueDate >= today;
}

export function receivableInMonth(payments: Payment[], month: string) {
  return roundMoney(
    payments.reduce((sum, payment) => {
      if (!payment.dueDate.startsWith(month)) return sum;
      if (!isOpenReceivable(payment)) return sum;
      return sum + remainingAmount(payment);
    }, 0)
  );
}

export function overdueInMonth(payments: Payment[], month: string, today = todayISO()) {
  return roundMoney(
    payments.reduce((sum, payment) => {
      if (!payment.dueDate.startsWith(month) || !isOverdue(payment, today)) return sum;
      return sum + remainingAmount(payment);
    }, 0)
  );
}

export function receivedInMonth(payments: Payment[], month: string) {
  return roundMoney(
    payments.reduce((sum, payment) => {
      const events = payment.historico.length > 0 ? payment.historico : paymentHistory(payment);
      return (
        sum +
        events
          .filter((event) => event.tipo === "pagamento" && event.data.startsWith(month))
          .reduce((inner, event) => inner + event.valor, 0)
      );
    }, 0)
  );
}

export function unpaidPatients(patients: Patient[], payments: Payment[], today = todayISO()) {
  const ids = new Set(payments.filter((payment) => isUnpaid(payment, today)).map((payment) => payment.patientId));
  return patients.filter((patient) => ids.has(patient.id));
}

export function patientsInGoodStanding(patients: Patient[], payments: Payment[], today = todayISO()) {
  const debtorIds = new Set(unpaidPatients(patients, payments, today).map((patient) => patient.id));
  const withPayments = new Set(payments.map((payment) => payment.patientId));
  return patients.filter((patient) => withPayments.has(patient.id) && !debtorIds.has(patient.id));
}

export function latestDueMonth(payments: Payment[], fromMonth: string) {
  const months = payments.map((payment) => payment.dueDate.slice(0, 7)).filter((month) => month >= fromMonth);
  return months.sort().at(-1) || fromMonth;
}

export function earliestOverdueMonth(payments: Payment[], today: string, current: string) {
  const months = payments
    .filter((payment) => payment.status === "em_haver" && payment.dueDate < today)
    .map((payment) => payment.dueDate.slice(0, 7));
  return months.sort()[0] || current;
}

export function earliestReceivedMonth(payments: Payment[], current: string) {
  const months = payments.flatMap((payment) => {
    const events = payment.historico.length > 0 ? payment.historico : paymentHistory(payment);
    const dated = events.filter((event) => event.tipo === "pagamento").map((event) => event.data.slice(0, 7));
    if (dated.length > 0) return dated;
    if (payment.status === "pago") return [(payment.paidAt || payment.createdAt).slice(0, 7)];
    return [];
  });
  return months.sort()[0] || current;
}

export function receivedFromPatientsInMonth(payments: Payment[], month: string) {
  return roundMoney(
    payments.reduce((sum, payment) => {
      if (isExternalPayment(payment)) return sum;
      const events = payment.historico.length > 0 ? payment.historico : paymentHistory(payment);
      return (
        sum +
        events
          .filter((event) => event.tipo === "pagamento" && event.data.startsWith(month))
          .reduce((inner, event) => inner + event.valor, 0)
      );
    }, 0)
  );
}

export function receivedExternalInMonth(payments: Payment[], month: string) {
  return roundMoney(receivedInMonth(payments, month) - receivedFromPatientsInMonth(payments, month));
}
