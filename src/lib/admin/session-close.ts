import type { Appointment, Payment, PaymentMethod, SessionPackage } from "./types";

export function sessionPaymentAmount(appointment: Appointment, packages: SessionPackage[]) {
  if (appointment.valor > 0) return appointment.valor;
  if (appointment.packageId) {
    const pack = packages.find((item) => item.id === appointment.packageId);
    if (pack?.valorSessao) return pack.valorSessao;
  }
  return 0;
}

export function paymentForAppointment(payments: Payment[], appointmentId: string) {
  return payments.find((item) => item.appointmentId === appointmentId && item.origem === "paciente") ?? null;
}

export function canRegisterSessionPayment(payment: Payment | null) {
  if (!payment) return true;
  return payment.status !== "pago";
}

export type SessionClosePaymentInput = {
  enabled: boolean;
  valor: number;
  formaPagamento: PaymentMethod;
  markPaid: boolean;
  issueReceipt: boolean;
};

export function defaultSessionClosePayment(
  appointment: Appointment,
  packages: SessionPackage[],
  existing: Payment | null
): SessionClosePaymentInput {
  const valor = existing ? Math.max(0, existing.valorAcordado || existing.valor) : sessionPaymentAmount(appointment, packages);
  return {
    enabled: Boolean(existing) || valor > 0,
    valor,
    formaPagamento: existing?.formaPagamento ? existing.formaPagamento : "pix",
    markPaid: !existing || existing.status !== "pago",
    issueReceipt: false,
  };
}
