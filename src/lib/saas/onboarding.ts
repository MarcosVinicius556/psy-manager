import type { Appointment, ClinicMember, Payment, Patient } from "@/lib/admin/types";
import type { AccountRecord } from "./model";

export type OnboardingStepId =
  | "perfil"
  | "horarios"
  | "paciente"
  | "sessao_agendada"
  | "sessao_concluida"
  | "pagamento"
  | "recibo_emitido"
  | "google_calendar";

export type OnboardingStep = {
  id: OnboardingStepId;
  label: string;
  done: boolean;
  href: string;
  optional?: boolean;
};

export type OnboardingSnapshot = {
  steps: OnboardingStep[];
  requiredTotal: number;
  requiredDone: number;
  complete: boolean;
};

export function buildOnboardingSteps(input: {
  account: AccountRecord;
  patients: Patient[];
  appointments: Appointment[];
  payments: Payment[];
  member: ClinicMember | null;
  googleCalendarConnected: boolean;
}): OnboardingSnapshot {
  const { account, patients, appointments, payments, member, googleCalendarConnected } = input;
  const profileDone = account.nome.trim().length > 2 && account.clinicName.trim().length > 1;
  const hoursDone = Boolean(member?.workHours?.length);
  const patientDone = patients.length > 0;
  const scheduledDone = appointments.some((item) => item.status === "agendado" || item.status === "em_andamento");
  const finishedDone = appointments.some((item) => item.status === "concluido");
  const paymentDone = payments.some((item) => item.status === "pago");
  const receiptDone = payments.some((item) => Boolean(item.reciboFiscal?.numero));

  const steps: OnboardingStep[] = [
    {
      id: "perfil",
      label: "Nome e nome do consultório",
      done: profileDone,
      href: "/admin/configuracoes",
    },
    {
      id: "horarios",
      label: "Horários de atendimento",
      done: hoursDone,
      href: "/admin/configuracoes",
    },
    {
      id: "paciente",
      label: "Primeiro paciente",
      done: patientDone,
      href: "/admin/pacientes/novo",
    },
    {
      id: "sessao_agendada",
      label: "Primeira sessão agendada",
      done: scheduledDone,
      href: "/admin/atendimentos/novo",
    },
    {
      id: "sessao_concluida",
      label: "Primeira sessão concluída",
      done: finishedDone,
      href: "/admin/agenda",
    },
    {
      id: "pagamento",
      label: "Primeiro pagamento registrado",
      done: paymentDone,
      href: "/admin/financeiro",
    },
    {
      id: "recibo_emitido",
      label: "Primeiro recibo emitido",
      done: receiptDone,
      href: "/admin/financeiro",
    },
    {
      id: "google_calendar",
      label: "Conectar Google Agenda",
      done: googleCalendarConnected,
      href: "/admin/configuracoes",
      optional: true,
    },
  ];

  const required = steps.filter((step) => !step.optional);
  const requiredDone = required.filter((step) => step.done).length;
  return {
    steps,
    requiredTotal: required.length,
    requiredDone,
    complete: requiredDone === required.length,
  };
}
