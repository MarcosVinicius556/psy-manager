"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import {
  addLocationMemberUid,
  claimUnownedRecords,
  createAppointment,
  createAppointmentSeries,
  createExpense,
  createLocation,
  createLocationInvite,
  createSessionFeedback,
  createMember,
  createNotification,
  createPackage,
  createPatient,
  createPayment,
  createPayments,
  findDirectoryUser,
  grantAccess,
  listClinicalRecordsForOwner,
  listAppointments,
  listExpenses,
  listLocationInvites,
  listLocations,
  listMembers,
  listNotifications,
  listPackages,
  listPatients,
  listSessionFeedbacks,
  listPayments,
  patchExpense,
  removeExpense,
  removeLocation,
  saveClinicalRecord,
  updateAppointment,
  updateExpense,
  updateLocation,
  publishDirectory,
  saveMemberPrivateProfile,
  setLocationInviteStatus,
  updateMember,
  updateNotification,
  setPatientSignedContract,
  updatePatient,
  setPackageArchived,
  updatePackage,
  updatePayment,
  upsertPsychologist,
} from "./collections";
import { authorizedHeaders } from "./api-auth";
import { updateAuthProfile } from "./account";
import { assertValidCpfOptional, isValidCpf } from "./cpf";
import { receivedAmount } from "./finance";
import { uploadClinicFile } from "./attachments";
import {
  canIssueFiscalReceipt,
  createFiscalReceiptPdf,
  fiscalReceiptFilename,
  nextReceiptNumber,
  paymentReceiptDate,
  stripCpfFields,
} from "./receipt-fiscal";
import { professionalFiscalReady } from "./receita-saude-report";
import { getFirebaseAuth } from "./firebase";
import { formatDate, formatMoney, monthlyDates, shiftDate, todayISO } from "./format";
import { roundMoney } from "./finance";
import { SINGLE_SESSION_PACKAGE_MESSAGE, packageChangeSummary, packageIntervalDays, packageSnapshot } from "./packages";
import { installmentDates, MAX_PAST_RECURRENCES, pendingRecurringCopies, recurringDatesBefore } from "./expenses";
import { receiptPatch, remainingAmount, unpaidPatch } from "./finance";
import { locationSharePeople, memberWorkplaces, userBelongsToLocation } from "./workplaces";
import {
  findLocationConflict,
  findProfessionalConflict,
  fitsWorkHours,
  intervalDates,
  isBookableStart,
  recurrenceDates,
  sharesMatchTotal,
} from "./schedule";
import { assertGoogleScheduleFree } from "@/lib/google-calendar/check-conflict-client";
import { syncAppointmentWithGoogle } from "@/lib/google-calendar/sync-client";
import { recordActivationEvent } from "@/lib/saas/activation-events";
import {
  emptyClinical,
  type Appointment,
  type AppointmentInput,
  type CareLocation,
  type ClinicalRecord,
  type ClinicAttachment,
  type ClinicMember,
  type Expense,
  type ExpenseInput,
  type DirectoryUser,
  type LocationInput,
  type LocationInvite,
  type MemberInput,
  type PackageInterval,
  type Patient,
  type PatientInput,
  type Payment,
  type PaymentInput,
  type PaymentNotification,
  type SessionFeedback,
  type SessionPackage,
} from "./types";

type ClinicContextValue = {
  patients: Patient[];
  appointments: Appointment[];
  payments: Payment[];
  packages: SessionPackage[];
  notifications: PaymentNotification[];
  members: ClinicMember[];
  locations: CareLocation[];
  locationInvites: LocationInvite[];
  expenses: Expense[];
  sessionFeedbacks: SessionFeedback[];
  loading: boolean;
  refresh: () => Promise<void>;
  savePatient: (input: PatientInput, id?: string) => Promise<string>;
  saveAppointment: (
    input: AppointmentInput,
    id?: string,
    recurrence?: { interval: PackageInterval; weekdays: number[]; until: string },
    extraDates?: string[]
  ) => Promise<{ id: string; sessions: { id: string; date: string }[] }>;
  createHaverPayments: (
    sessions: { id: string; date: string }[],
    input: {
      patientId: string;
      valor: number;
      valorSocial: boolean;
      dueDate?: string;
      packageCharge?: { packageId: string; nome: string; sessoes: number; dueDate: string };
    }
  ) => Promise<number>;
  setAppointmentStatus: (
    id: string,
    status: Appointment["status"],
    clinical?: ClinicalRecord,
    faltaJustificativa?: string
  ) => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;
  savePackage: (
    input: {
      nome: string;
      tipo: SessionPackage["tipo"];
      valorSessao: number;
      sessoes: number;
      observacoes: string;
    },
    id?: string
  ) => Promise<string>;
  archivePackage: (id: string, arquivado: boolean) => Promise<void>;
  saveClinical: (id: string, clinical: ClinicalRecord) => Promise<void>;
  savePayment: (input: PaymentInput, until?: string) => Promise<void>;
  receivePayment: (
    id: string,
    input: {
      valor: number;
      formaPagamento: Payment["formaPagamento"];
      data: string;
      observacao: string;
      comprovante?: ClinicAttachment | null;
    }
  ) => Promise<void>;
  answerPayment: (notification: PaymentNotification, resposta: "pago" | "nao_pago") => Promise<void>;
  saveMember: (input: MemberInput) => Promise<string>;
  saveOwnProfile: (input: {
    nome: string;
    telefone: string;
    foto: string;
    cpf: string;
    crpNumero: string;
    crpRegiao: string;
    enderecoLogradouro: string;
    enderecoCidade: string;
    enderecoUf: string;
    enderecoCep: string;
    valorBase: number;
    valorSocial: number;
    workHours: { weekday: number; startTime: string; endTime: string }[];
  }) => Promise<void>;
  issueFiscalReceipt: (paymentId: string, options?: { replace?: boolean }) => Promise<void>;
  saveContractTemplate: (template: string) => Promise<void>;
  saveSignedContract: (patientId: string, file: ClinicAttachment | null) => Promise<void>;
  setMemberActive: (id: string, ativo: boolean) => Promise<void>;
  saveLocation: (input: LocationInput, id?: string) => Promise<string>;
  lookupDirectoryUser: (email: string) => Promise<DirectoryUser | null>;
  sendLocationInvite: (locationId: string, person: DirectoryUser) => Promise<void>;
  answerLocationInvite: (invite: LocationInvite, status: "aceito" | "recusado") => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  saveExpense: (input: ExpenseInput, id?: string) => Promise<void>;
  payExpense: (id: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  patientName: (id: string) => string;
  memberName: (id: string | null) => string;
  locationName: (id: string | null) => string;
};

const ClinicContext = createContext<ClinicContextValue | undefined>(undefined);

function dedupeMembers(items: ClinicMember[]) {
  const sorted = [...items].sort((a, b) => Number(Boolean(b.uid)) - Number(Boolean(a.uid)));
  const seen = new Set<string>();
  const result: ClinicMember[] = [];
  for (const item of sorted) {
    const keys = [item.uid, item.email].filter((key): key is string => Boolean(key));
    if (keys.some((key) => seen.has(key))) continue;
    keys.forEach((key) => seen.add(key));
    result.push(item);
  }
  return result;
}

async function syncOwnedAccess(uid: string) {
  const [ownedLocations, ownedAppointments, ownedExpenses] = await Promise.all([
    listLocations(),
    listAppointments(),
    listExpenses(),
  ]);
  for (const location of ownedLocations) {
    if (location.createdByUid !== uid) continue;
    if (!location.memberUids.includes(uid)) await addLocationMemberUid(location.id, uid);
    const viewers = Array.from(new Set([uid, ...location.memberUids]));
    if (viewers.length <= 1) continue;
    for (const item of ownedAppointments) {
      if (item.locationId !== location.id) continue;
      if (viewers.every((id) => item.accessUids.includes(id))) continue;
      await grantAccess("appointments", item.id, viewers);
    }
    for (const item of ownedExpenses) {
      if (item.locationId !== location.id) continue;
      if (viewers.every((id) => item.accessUids.includes(id))) continue;
      await grantAccess("expenses", item.id, viewers);
    }
  }
}

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [members, setMembers] = useState<ClinicMember[]>([]);
  const [locations, setLocations] = useState<CareLocation[]>([]);
  const [locationInvites, setLocationInvites] = useState<LocationInvite[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sessionFeedbacks, setSessionFeedbacks] = useState<SessionFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const synced = useRef(false);

  const refresh = useCallback(async () => {
    const [nextPatients, nextAppointments, nextPayments, nextNotifications, nextMembers, nextLocations, nextExpenses, nextPackages, nextInvites, nextFeedbacks, clinicalRecords] =
      await Promise.all([
        listPatients(),
        listAppointments(),
        listPayments(),
        listNotifications(),
        listMembers(),
        listLocations(),
        listExpenses(),
        listPackages(),
        listLocationInvites(),
        listSessionFeedbacks(),
        listClinicalRecordsForOwner(),
      ]);
    const clinicalByAppointment = new Map(clinicalRecords.map((item) => [item.appointmentId, item.clinical]));
    const mergedAppointments = nextAppointments.map((appointment) => ({
      ...appointment,
      clinical: clinicalByAppointment.get(appointment.id) ?? emptyClinical(),
    }));
    const uid = getFirebaseAuth().currentUser?.uid;
    let listedExpenses = nextExpenses;
    if (uid) {
      const pending = pendingRecurringCopies(listedExpenses.filter((expense) => expense.ownerUid === uid));
      if (pending.length > 0) {
        for (const item of pending) await createExpense(item.input, item.accessUids);
        listedExpenses = await listExpenses();
        toast.success(pending.length === 1 ? "Uma despesa fixa foi gerada para este período." : `${pending.length} despesas fixas foram geradas para este período.`);
      }
    }
    nextPatients.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    mergedAppointments.sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));
    nextPayments.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    nextMembers.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    nextLocations.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    listedExpenses.sort((a, b) => b.competencia.localeCompare(a.competencia) || a.descricao.localeCompare(b.descricao, "pt-BR"));
    nextPackages.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setPatients(nextPatients);
    setAppointments(mergedAppointments);
    setPayments(nextPayments);
    setNotifications(nextNotifications);
    setMembers(dedupeMembers(nextMembers));
    setLocations(nextLocations);
    setLocationInvites(nextInvites);
    setExpenses(listedExpenses);
    setPackages(nextPackages);
    setSessionFeedbacks(nextFeedbacks);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const currentUser = getFirebaseAuth().currentUser;
        if (currentUser) {
          try {
            await claimUnownedRecords(currentUser.uid);
          } catch (error) {
            console.error(error);
          }
          try {
            await syncOwnedAccess(currentUser.uid);
          } catch (error) {
            console.error(error);
          }
        }
        if (!synced.current) {
          synced.current = true;
          const [nextPayments, nextNotifications] = await Promise.all([listPayments(), listNotifications()]);
          const today = todayISO();
          const known = new Set(nextNotifications.map((item) => item.paymentId));
          const due = nextPayments.filter(
            (payment) =>
              payment.origem !== "externo" &&
              payment.patientId &&
              payment.status === "em_haver" &&
              payment.dueDate <= today &&
              !known.has(payment.id)
          );
          await Promise.all(
            due.map((payment) =>
              createNotification({
                type: "payment_due",
                paymentId: payment.id,
                patientId: payment.patientId,
                date: today,
                lida: false,
                resposta: null,
                createdAt: new Date().toISOString(),
              })
            )
          );
        }
        if (active) await refresh();
        const current = getFirebaseAuth().currentUser;
        if (active && current?.email) {
          const people = await listMembers();
          const email = current.email.toLowerCase();
          const mine = people.find((member) => member.uid === current.uid || member.email === email);
          if (!mine) {
            await upsertPsychologist(current.uid, email, { nome: current.displayName || "", foto: current.photoURL || "" });
            if (active) await refresh();
          } else {
            await publishDirectory({
              uid: current.uid,
              email,
              nome: mine.nome || email.split("@")[0],
              foto: mine.foto,
            });
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Não foi possível carregar os dados do painel.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (loading) return;
    let authUser: { uid: string; email: string | null } | null = null;
    try {
      authUser = getFirebaseAuth().currentUser;
    } catch {
      return;
    }
    if (!authUser?.email) return;
    const email = authUser.email.toLowerCase();
    const mine = members.find((member) => member.uid === authUser?.uid);
    if (!mine || mine.email === email) return;
    updateMember(mine.id, { email })
      .then(() => refresh())
      .catch((error) => console.error(error));
  }, [loading, members, refresh]);

  const patientName = useCallback(
    (id: string) => patients.find((patient) => patient.id === id)?.nome || "Paciente removido",
    [patients]
  );

  const memberName = useCallback(
    (id: string | null) => {
      if (!id) return "Sem profissional";
      return members.find((member) => member.id === id)?.nome || "Profissional removido";
    },
    [members]
  );

  const locationName = useCallback(
    (id: string | null) => {
      if (!id) return "Sem local";
      return locations.find((location) => location.id === id)?.nome || "Local removido";
    },
    [locations]
  );

  function trackActivation(event: Parameters<typeof recordActivationEvent>[1]) {
    const uid = getFirebaseAuth().currentUser?.uid;
    if (uid) void recordActivationEvent(uid, event);
  }

  function currentUid() {
    const uid = getFirebaseAuth().currentUser?.uid;
    if (!uid) throw new Error("Entre novamente para continuar.");
    return uid;
  }

  function viewersFor(locationId: string | null) {
    const uid = currentUid();
    const location = locationId ? locations.find((item) => item.id === locationId) : undefined;
    const shared = location
      ? locationSharePeople(location, members, locationInvites)
          .map((person) => person.id)
          .filter(
            (id) =>
              location.memberUids.includes(id) ||
              id === location.createdByUid ||
              members.some((member) => member.uid === id) ||
              locationInvites.some((invite) => invite.locationId === location.id && (invite.inviteeUid === id || invite.ownerUid === id))
          )
      : [];
    return Array.from(new Set([uid, ...(location?.memberUids ?? []), ...shared]));
  }

  function assertScheduleFree(candidate: AppointmentInput, id?: string) {
    const locationConflict = findLocationConflict(appointments, candidate, id);
    if (locationConflict) {
      const who = memberName(locationConflict.professionalId);
      const knownPatient = patients.some((patient) => patient.id === locationConflict.patientId);
      const detail = knownPatient ? `por ${patientName(locationConflict.patientId)} (${who})` : "por outro atendimento";
      throw new Error(
        `Em ${formatDate(candidate.date)}, ${locationConflict.startTime}–${locationConflict.endTime} já está ocupado em ${locationName(candidate.locationId)} ${detail}.`
      );
    }
    const professionalConflict = findProfessionalConflict(appointments, candidate, id);
    if (professionalConflict) {
      throw new Error(
        `Em ${formatDate(candidate.date)}, ${memberName(candidate.professionalId)} já atende ${patientName(professionalConflict.patientId)} (${professionalConflict.startTime}–${professionalConflict.endTime}).`
      );
    }
  }

  async function promoteNextSessionPayment(patientId: string, settledId: string) {
    if (!patientId) return;
    const sessionPayments = (payment: Payment) =>
      payment.patientId === patientId && payment.id !== settledId && payment.origem !== "externo" && !payment.packageId;
    const stillOpen = payments.some((payment) => sessionPayments(payment) && payment.status === "em_haver");
    if (stillOpen) return;
    const next = payments
      .filter((payment) => sessionPayments(payment) && payment.status === "agendado")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
    if (next) await updatePayment(next.id, { status: "em_haver" });
  }

  const value = useMemo<ClinicContextValue>(() => {
    return {
      patients,
      appointments,
      payments,
      packages,
      notifications,
      members,
      locations,
      locationInvites,
      expenses,
      sessionFeedbacks,
      loading,
      refresh,
      patientName,
      memberName,
      locationName,
      async savePatient(input, id) {
        if (!input.nome.trim()) throw new Error("Informe o nome do paciente.");
        const cpf = assertValidCpfOptional(input.cpf, "CPF do paciente");
        const cpfPagador = assertValidCpfOptional(input.cpfPagador, "CPF do pagador");
        const cpfBeneficiario = assertValidCpfOptional(input.cpfBeneficiario, "CPF do beneficiário");
        const payload = stripCpfFields({
          ...input,
          nome: input.nome.trim(),
          cpf,
          cpfPagador,
          cpfBeneficiario,
        });
        if (id) {
          await updatePatient(id, payload);
          toast.success("Paciente atualizado.");
          await refresh();
          return id;
        }
        const created = await createPatient(payload);
        trackActivation("primeiro_paciente");
        toast.success("Paciente cadastrado.");
        await refresh();
        return created;
      },
      async saveAppointment(input, id, recurrence, extraDates) {
        if (!input.patientId) throw new Error("Selecione um paciente.");
        if (!input.date || !input.startTime || !input.endTime) throw new Error("Informe data e horário.");
        if (input.endTime <= input.startTime) throw new Error("O horário final precisa ser depois do início.");
        const currentAppointment = id ? appointments.find((item) => item.id === id) : undefined;
        const sameStart = currentAppointment?.date === input.date && currentAppointment.startTime === input.startTime;
        if (!sameStart && !isBookableStart(input.date, input.startTime)) {
          throw new Error("Este horário já passou.");
        }
        if (!input.valor || input.valor <= 0) throw new Error("Informe o valor da sessão.");
        const professional = members.find((member) => member.id === input.professionalId);
        let locationId = input.locationId || null;
        if (!locationId && input.modality === "presencial") {
          const places = memberWorkplaces(locations, professional, professional?.uid);
          if (places.length === 1) locationId = places[0].id;
        }
        if (!locationId && input.modality === "presencial") {
          throw new Error("Selecione o local de atendimento.");
        }
        if (locationId) {
          const location = locations.find((item) => item.id === locationId);
          if (!location) throw new Error("Local de atendimento não encontrado.");
          if (input.professionalId && !userBelongsToLocation(location, professional, professional?.uid)) {
            throw new Error("Este profissional não está vinculado a este local.");
          }
        }
        const hours = professional?.workHours || [];
        if (hours.length && !fitsWorkHours(hours, input.date, input.startTime, input.endTime)) {
          throw new Error("Este horário está fora da sua grade de atendimento. Ajuste em Configurações.");
        }
        const packageId = input.packageId || null;
        let sessionValue = input.valor;
        let socialRate = Boolean(input.valorSocial);
        let packageVersao: number | null = null;
        const pack = packageId ? packages.find((item) => item.id === packageId) : undefined;
        if (packageId) {
          if (!pack) throw new Error("Pacote não encontrado.");
          const samePackage = currentAppointment?.packageId === packageId;
          if (pack.arquivado && !samePackage) throw new Error("Este pacote está arquivado e não entra em novos atendimentos.");
          if (samePackage) {
            sessionValue = currentAppointment.valor;
            packageVersao = currentAppointment.packageVersao;
          } else {
            const snapshot = packageSnapshot(pack);
            sessionValue = snapshot.valorSessao;
            packageVersao = snapshot.versao;
          }
          socialRate = false;
        }
        const payload = {
          ...input,
          locationId,
          professionalId: input.professionalId || null,
          sessionType: input.sessionType || "padrao",
          valor: sessionValue,
          valorSocial: socialRate,
          packageId,
          packageVersao,
          faltaJustificativa: input.faltaJustificativa || "",
          recurring: Boolean(input.recurring),
          seriesId: input.seriesId || null,
        };
        async function consumePackageCredits(count: number) {
          if (!packageId || count < 1) return;
          const credits = appointments
            .filter((item) => item.patientId === input.patientId && item.packageId === packageId && item.creditoEmHaver)
            .slice(0, count);
          for (const credit of credits) {
            await updateAppointment(credit.id, { creditoEmHaver: false });
          }
        }
        const moreDates = [...new Set((extraDates || []).filter((date) => date && date !== input.date))];
        if (moreDates.length && recurrence) throw new Error("A recorrência e as sessões do pacote não podem ser usadas juntas.");
        for (const date of moreDates) {
          if (!isBookableStart(date, payload.startTime)) throw new Error(`Em ${formatDate(date)}, este horário já passou.`);
          if (hours.length && !fitsWorkHours(hours, date, payload.startTime, payload.endTime)) {
            throw new Error(`Em ${formatDate(date)}, este horário está fora da sua grade de atendimento.`);
          }
          await assertGoogleScheduleFree({ ...payload, date });
          assertScheduleFree({ ...payload, date });
        }
        if (!id && recurrence) {
          if (recurrence.interval === "semanal" && !recurrence.weekdays.length) {
            throw new Error("Selecione ao menos um dia da semana.");
          }
          if (!recurrence.until || recurrence.until < input.date) {
            throw new Error("A recorrência precisa terminar na data da primeira sessão ou depois.");
          }
          const dates =
            recurrence.interval === "semanal"
              ? recurrenceDates(input.date, recurrence.until, recurrence.weekdays)
              : intervalDates(input.date, recurrence.until, packageIntervalDays(recurrence.interval));
          if (!dates.includes(input.date)) {
            throw new Error("O dia da primeira sessão precisa estar na recorrência.");
          }
          if (dates.length > 48) throw new Error("Essa recorrência passa de 48 sessões. Encurte o período.");
          if (!isBookableStart(input.date, payload.startTime)) throw new Error("Este horário já passou.");
          if (hours.length && !fitsWorkHours(hours, input.date, payload.startTime, payload.endTime)) {
            throw new Error("Este horário está fora da sua grade de atendimento.");
          }
          await assertGoogleScheduleFree({ ...payload, date: input.date });
          assertScheduleFree({ ...payload, date: input.date });
          const booked: string[] = [];
          for (const date of dates) {
            if (date === input.date) {
              booked.push(date);
              continue;
            }
            if (!isBookableStart(date, payload.startTime)) continue;
            if (hours.length && !fitsWorkHours(hours, date, payload.startTime, payload.endTime)) continue;
            try {
              await assertGoogleScheduleFree({ ...payload, date });
              assertScheduleFree({ ...payload, date });
              booked.push(date);
            } catch {
              // horário indisponível no sistema ou no Google
            }
          }
          const seriesId = crypto.randomUUID();
          const ids = await createAppointmentSeries(
            booked.map((date) => ({
              ...payload,
              date,
              recurring: true,
              seriesId,
              status: "agendado" as const,
              clinical: { ...payload.clinical },
            })),
            viewersFor(locationId)
          );
          toast.success(`${booked.length} sessões recorrentes agendadas.`);
          await consumePackageCredits(booked.length);
          await refresh();
          for (const createdId of ids) void syncAppointmentWithGoogle(createdId);
          return { id: ids[0] || "", sessions: booked.map((date, index) => ({ id: ids[index], date })) };
        }
        await assertGoogleScheduleFree(payload);
        assertScheduleFree(payload, id);
        const packageSeriesId = moreDates.length ? crypto.randomUUID() : null;
        const companions = moreDates.map((date) => ({
          ...payload,
          date,
          recurring: Boolean(packageSeriesId),
          seriesId: packageSeriesId,
          status: "agendado" as const,
          clinical: emptyClinical(),
          faltaJustificativa: "",
        }));
        if (id) {
          await updateAppointment(id, {
            ...payload,
            recurring: Boolean(packageSeriesId) || payload.recurring,
            seriesId: packageSeriesId || payload.seriesId,
          });
          await grantAccess("appointments", id, viewersFor(locationId));
          if (companions.length) {
            const created = await createAppointmentSeries(companions, viewersFor(locationId));
            toast.success("Atendimento atualizado, com as outras sessões do pacote.");
            await consumePackageCredits(companions.length);
            await refresh();
            void syncAppointmentWithGoogle(id);
            for (const createdId of created) void syncAppointmentWithGoogle(createdId);
            return { id, sessions: [{ id, date: payload.date }, ...companions.map((item, index) => ({ id: created[index], date: item.date }))] };
          }
          toast.success("Atendimento atualizado.");
          await refresh();
          void syncAppointmentWithGoogle(id);
          return { id, sessions: [] };
        }
        if (companions.length) {
          const ids = await createAppointmentSeries(
            [
              {
                ...payload,
                recurring: Boolean(packageSeriesId),
                seriesId: packageSeriesId,
                status: "agendado" as const,
                clinical: emptyClinical(),
              },
              ...companions,
            ],
            viewersFor(locationId)
          );
          toast.success(`${ids.length} sessões do pacote agendadas.`);
          await consumePackageCredits(ids.length);
          await refresh();
          for (const createdId of ids) void syncAppointmentWithGoogle(createdId);
          return {
            id: ids[0] || "",
            sessions: [{ ...payload, status: "agendado" as const }, ...companions].map((item, index) => ({ id: ids[index], date: item.date })),
          };
        }
        const created = await createAppointment(payload, viewersFor(locationId));
        toast.success("Atendimento agendado.");
        await consumePackageCredits(1);
        await refresh();
        void syncAppointmentWithGoogle(created);
        return { id: created, sessions: [{ id: created, date: payload.date }] };
      },
      async createHaverPayments(sessions, input) {
        if (!input.patientId) throw new Error("Selecione um paciente.");
        if (!input.valor || input.valor <= 0) throw new Error("Informe o valor da sessão.");
        if (input.packageCharge) {
          const charge = input.packageCharge;
          if (!charge.dueDate) throw new Error("Informe a data de pagamento do pacote.");
          if (!charge.sessoes || charge.sessoes < 1) throw new Error("O pacote não tem sessões para lançar.");
          const existing = payments.find(
            (payment) =>
              payment.patientId === input.patientId &&
              payment.packageId === charge.packageId &&
              payment.status !== "nao_pago"
          );
          if (existing) {
            toast.info(`Este paciente já tem o pagamento deste pacote em ${formatDate(existing.dueDate)}.`);
            return 0;
          }
          const total = roundMoney(input.valor * charge.sessoes);
          await createPayment({
            patientId: input.patientId,
            appointmentId: sessions.find((session) => session.id)?.id || null,
            packageId: charge.packageId,
            descricao: `${charge.nome} · ${charge.sessoes} sessões`,
            valor: total,
            dueDate: charge.dueDate,
            formaPagamento: "pix",
            status: "em_haver",
          });
          toast.success(`Pagamento do pacote lançado: ${formatMoney(total)} em ${formatDate(charge.dueDate)}.`);
          await refresh();
          return 1;
        }
        const due = sessions.filter((session) => session.id).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
        if (due.length === 0) return 0;
        const openSessions = payments.filter(
          (payment) =>
            payment.patientId === input.patientId &&
            !payment.packageId &&
            (payment.status === "em_haver" || payment.status === "agendado")
        );
        const earliestExisting = [...openSessions].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
        const haverId = !earliestExisting || due[0].date < earliestExisting.dueDate ? due[0].id : "";
        if (haverId) {
          const later = openSessions.filter((payment) => payment.status === "em_haver");
          await Promise.all(later.map((payment) => updatePayment(payment.id, { status: "agendado" })));
        } else if (earliestExisting && earliestExisting.status !== "em_haver") {
          await updatePayment(earliestExisting.id, { status: "em_haver" });
          const later = openSessions.filter((payment) => payment.id !== earliestExisting.id && payment.status === "em_haver");
          await Promise.all(later.map((payment) => updatePayment(payment.id, { status: "agendado" })));
        }
        await createPayments(
          due.map((session) => ({
            patientId: input.patientId,
            appointmentId: session.id,
            descricao: input.valorSocial ? "Sessão · valor social" : "Sessão",
            valor: input.valor,
            dueDate: due.length === 1 && input.dueDate ? input.dueDate : session.date,
            formaPagamento: "pix" as const,
            status: session.id === haverId ? "em_haver" : "agendado",
          }))
        );
        const haverCount = due.filter((session) => session.id === haverId).length;
        toast.success(
          due.length === 1
            ? haverCount
              ? "Lançamento em haver registrado."
              : "Lançamento agendado registrado."
            : haverCount
              ? `1 lançamento em haver e ${due.length - 1} agendados.`
              : `${due.length} lançamentos agendados. O próximo atendimento deste paciente já está em haver.`
        );
        await refresh();
        return due.length;
      },
      async setAppointmentStatus(id, status, clinical, faltaJustificativa) {
        const appointment = appointments.find((item) => item.id === id);
        if (clinical && appointment) {
          await saveClinicalRecord(id, appointment.patientId, clinical);
        }
        await updateAppointment(id, {
          status,
          ...(status === "faltou" ? { faltaJustificativa: (faltaJustificativa || "").trim() } : {}),
        });
        if (status === "concluido") {
          trackActivation("primeira_sessao_concluida");
          try {
            const appointment = appointments.find((item) => item.id === id);
            const existing = sessionFeedbacks.find((item) => item.appointmentId === id);
            if (appointment && !existing) {
              const patient = patients.find((item) => item.id === appointment.patientId);
              await createSessionFeedback({
                appointmentId: appointment.id,
                patientId: appointment.patientId,
                professionalNome: memberName(appointment.professionalId),
                patientNome: patient?.nome || patientName(appointment.patientId),
                sessionDate: appointment.date,
                startTime: appointment.startTime,
              });
            }
            toast.success("Atendimento finalizado. O link de feedback está pronto para enviar.");
          } catch (error) {
            console.error(error);
            toast.warn("Atendimento finalizado, mas o link de feedback não foi gerado. Finalize de novo para tentar.");
          }
        } else {
          toast.success(status === "faltou" ? "Falta registrada." : "Atendimento atualizado.");
        }
        await refresh();
      },
      async cancelAppointment(id) {
        const appointment = appointments.find((item) => item.id === id);
        if (!appointment) throw new Error("Atendimento não encontrado.");
        if (appointment.status === "cancelado") throw new Error("Este atendimento já está cancelado.");
        if (appointment.status === "concluido") throw new Error("Um atendimento finalizado não pode ser cancelado por aqui.");
        const credit = Boolean(appointment.packageId);
        await updateAppointment(id, { status: "cancelado", creditoEmHaver: credit });
        toast.success(
          credit
            ? "Agendamento cancelado. A sessão do pacote ficou em haver para este paciente."
            : "Agendamento cancelado."
        );
        await refresh();
        void syncAppointmentWithGoogle(id, "delete");
      },
      async savePackage(input, id) {
        const uid = currentUid();
        const mine = members.find((member) => member.uid === uid);
        if (input.sessoes === 1) throw new Error(SINGLE_SESSION_PACKAGE_MESSAGE);
        if (input.tipo === "semanal") throw new Error("Pacote semanal não está disponível. Escolha quinzenal, mensal ou personalizado.");
        if (!input.nome.trim()) throw new Error("Informe o nome do pacote.");
        if (!input.valorSessao || input.valorSessao <= 0) throw new Error("Informe o valor de cada atendimento.");
        if (!Number.isInteger(input.sessoes) || input.sessoes < 2 || input.sessoes > 30) {
          throw new Error("Informe de 2 a 30 sessões no pacote.");
        }
        const tipo = input.tipo === "quinzenal" && input.sessoes !== 2 ? "personalizado" : input.tipo === "mensal" && input.sessoes !== 4 ? "personalizado" : input.tipo;
        const payload = {
          professionalId: mine?.id || null,
          nome: input.nome.trim(),
          tipo,
          valorSessao: input.valorSessao,
          sessoes: input.sessoes,
          observacoes: input.observacoes.trim(),
        };
        if (!id) {
          const now = new Date().toISOString();
          const created = await createPackage(payload, [
            {
              id: crypto.randomUUID(),
              versao: 1,
              quando: now,
              resumo: "Pacote criado",
              nome: payload.nome,
              tipo: payload.tipo,
              valorSessao: payload.valorSessao,
              sessoes: payload.sessoes,
              observacoes: payload.observacoes,
            },
          ]);
          toast.success("Pacote cadastrado.");
          await refresh();
          return created;
        }
        const current = packages.find((item) => item.id === id);
        if (!current) throw new Error("Pacote não encontrado.");
        const summary = packageChangeSummary(current, payload);
        if (!summary) {
          toast.success("Nenhuma alteração no pacote.");
          return id;
        }
        const nextVersion = (current.versao || 1) + 1;
        const now = new Date().toISOString();
        const previous = current.historico.length
          ? current.historico
          : [
              {
                id: `${current.id}-v1`,
                versao: current.versao || 1,
                quando: current.createdAt,
                resumo: "Versão inicial",
                nome: current.nome,
                tipo: current.tipo,
                valorSessao: current.valorSessao,
                sessoes: current.sessoes || 1,
                observacoes: current.observacoes,
              },
            ];
        await updatePackage(id, { ...payload, professionalId: current.professionalId }, nextVersion, [
          ...previous,
          {
            id: crypto.randomUUID(),
            versao: nextVersion,
            quando: now,
            resumo: summary,
            nome: payload.nome,
            tipo: payload.tipo,
            valorSessao: payload.valorSessao,
            sessoes: payload.sessoes,
            observacoes: payload.observacoes,
          },
        ]);
        toast.success(`Pacote atualizado para a versão ${nextVersion}. Atendimentos já marcados permanecem na versão anterior.`);
        await refresh();
        return id;
      },
      async archivePackage(id, arquivado) {
        const current = packages.find((item) => item.id === id);
        if (!current) throw new Error("Pacote não encontrado.");
        if (current.arquivado === arquivado) return;
        const now = new Date().toISOString();
        const previous = current.historico.length
          ? current.historico
          : [
              {
                id: `${current.id}-v1`,
                versao: current.versao || 1,
                quando: current.createdAt,
                resumo: "Versão inicial",
                nome: current.nome,
                tipo: current.tipo,
                valorSessao: current.valorSessao,
                sessoes: current.sessoes || 1,
                observacoes: current.observacoes,
              },
            ];
        await setPackageArchived(id, arquivado, [
          ...previous,
          {
            id: crypto.randomUUID(),
            versao: current.versao || 1,
            quando: now,
            resumo: arquivado ? "Pacote arquivado" : "Pacote reativado",
            nome: current.nome,
            tipo: current.tipo,
            valorSessao: current.valorSessao,
            sessoes: current.sessoes || 1,
            observacoes: current.observacoes,
          },
        ]);
        toast.success(arquivado ? "Pacote arquivado. Ele sai dos novos atendimentos e o histórico permanece." : "Pacote reativado.");
        await refresh();
      },
      async saveClinical(id, clinical) {
        const appointment = appointments.find((item) => item.id === id);
        if (!appointment) throw new Error("Atendimento não encontrado.");
        await saveClinicalRecord(id, appointment.patientId, clinical);
        toast.success("Ficha salva.");
        await refresh();
      },
      async savePayment(input, until) {
        if (!input.dueDate) throw new Error("Informe a data do pagamento.");
        if (!input.valor || input.valor <= 0) throw new Error("Informe um valor maior que zero.");
        if (input.origem === "externo") {
          const descricao = input.descricao.trim();
          if (!descricao) throw new Error("Informe o que é esta renda.");
          const base = {
            patientId: "",
            appointmentId: null,
            packageId: null,
            origem: "externo" as const,
            descricao,
            valor: input.valor,
            formaPagamento: input.formaPagamento,
            status: "agendado" as const,
          };
          if (input.recorrente) {
            if (!until || until < input.dueDate) throw new Error("Informe até quando a renda se repete.");
            const dates = monthlyDates(input.dueDate, until, 37);
            if (dates.length < 2) throw new Error("A recorrência precisa incluir ao menos dois meses. Ajuste a data final ou deixe como lançamento único.");
            if (dates.length > 36) throw new Error("A renda recorrente passa de 36 meses. Encurte o período.");
            const seriesId = crypto.randomUUID();
            await createPayments(dates.map((dueDate) => ({ ...base, dueDate, recorrente: true, seriesId })));
            toast.success(`${dates.length} lançamentos de renda externa agendados.`);
          } else {
            await createPayment({ ...base, dueDate: input.dueDate, recorrente: false, seriesId: null });
            toast.success("Renda externa registrada.");
          }
          await refresh();
          return;
        }
        if (!input.patientId) throw new Error("Selecione um paciente.");
        await createPayment({
          ...input,
          origem: "paciente",
          descricao: input.descricao.trim() || "Sessão",
          appointmentId: input.appointmentId || null,
        });
        toast.success("Lançamento registrado.");
        await refresh();
      },
      async receivePayment(id, input) {
        const payment = payments.find((item) => item.id === id);
        if (!payment) throw new Error("Lançamento não encontrado.");
        const patch = receiptPatch(payment, input);
        await updatePayment(id, {
          historico: patch.historico,
          valorAcordado: patch.valorAcordado,
          status: patch.status,
          paidAt: patch.paidAt,
          formaPagamento: patch.formaPagamento,
        });
        if (patch.status === "pago" && payment.status !== "pago") trackActivation("primeiro_pagamento");
        if (!patch.parcial && !payment.packageId) await promoteNextSessionPayment(payment.patientId, payment.id);
        toast.success(
          patch.parcial ? `Pagamento parcial registrado. Falta ${patch.faltante.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.` : "Pagamento confirmado."
        );
        await refresh();
      },
      async answerPayment(notification, resposta) {
        const payment = payments.find((item) => item.id === notification.paymentId);
        if (resposta === "pago") {
          if (!payment) throw new Error("Lançamento não encontrado.");
          const missing = remainingAmount(payment);
          if (missing > 0) {
            const patch = receiptPatch(payment, {
              valor: missing,
              formaPagamento: payment.formaPagamento,
              data: todayISO(),
              observacao: "Confirmado pela notificação",
            });
            await updatePayment(payment.id, {
              historico: patch.historico,
              valorAcordado: patch.valorAcordado,
              status: patch.status,
              paidAt: patch.paidAt,
              formaPagamento: patch.formaPagamento,
            });
            if (!patch.parcial && !payment.packageId) await promoteNextSessionPayment(payment.patientId, payment.id);
            trackActivation("primeiro_pagamento");
          }
        } else if (payment) {
          const patch = unpaidPatch(payment);
          await updatePayment(payment.id, patch);
          if (!payment.packageId) await promoteNextSessionPayment(payment.patientId, payment.id);
        } else {
          await updatePayment(notification.paymentId, { status: "nao_pago", paidAt: null });
        }
        await updateNotification(notification.id, { lida: true, resposta });
        toast.success(resposta === "pago" ? "Pagamento confirmado." : "Pagamento marcado como não pago.");
        await refresh();
      },
      async saveMember(input) {
        if (!input.nome.trim()) throw new Error("Informe o nome do profissional.");
        if (!input.email.trim()) throw new Error("Informe o e-mail do profissional.");
        const email = input.email.trim().toLowerCase();
        if (members.some((member) => member.email === email)) throw new Error("Já existe um profissional com este e-mail.");
        const created = await createMember({ nome: input.nome.trim(), email });
        toast.success("Profissional cadastrado.");
        await refresh();
        return created;
      },
      async saveOwnProfile(input) {
        const uid = currentUid();
        const mine = members.find((member) => member.uid === uid);
        if (!mine) throw new Error("Seu cadastro ainda não está na lista de profissionais. Saia e entre de novo.");
        if (!input.nome.trim()) throw new Error("Informe seu nome.");
        const nome = input.nome.trim();
        const foto = input.foto.trim();
        if (input.valorBase < 0 || input.valorSocial < 0) throw new Error("Os valores da consulta não podem ser negativos.");
        for (const shift of input.workHours) {
          if (!shift.startTime || !shift.endTime) throw new Error("Informe início e fim de cada horário de atendimento.");
          if (shift.endTime <= shift.startTime) throw new Error("O horário final precisa ser depois do início.");
        }
        const cpf = assertValidCpfOptional(input.cpf, "CPF");
        if (input.cpf.trim() && !isValidCpf(input.cpf)) throw new Error("CPF inválido.");
        await saveMemberPrivateProfile(uid, {
          cpf,
          crpNumero: input.crpNumero.replace(/\D/g, "").trim(),
          crpRegiao: input.crpRegiao.replace(/\D/g, "").padStart(2, "0").slice(0, 2),
          enderecoLogradouro: input.enderecoLogradouro.trim(),
          enderecoCidade: input.enderecoCidade.trim(),
          enderecoUf: input.enderecoUf.trim().toUpperCase().slice(0, 2),
          enderecoCep: input.enderecoCep.replace(/\D/g, "").slice(0, 8),
        });
        await updateMember(mine.id, {
          nome,
          telefone: input.telefone.trim(),
          foto,
          valorBase: input.valorBase,
          valorSocial: input.valorSocial,
          workHours: input.workHours,
        });
        if (input.workHours.length > 0) trackActivation("horarios_definidos");
        await updateAuthProfile({ displayName: nome, ...(foto ? { photoURL: foto } : {}) });
        if (mine.email) await publishDirectory({ uid, email: mine.email, nome, foto });
        toast.success("Cadastro atualizado.");
        await refresh();
      },
      async issueFiscalReceipt(paymentId, options) {
        const uid = currentUid();
        const mine = members.find((member) => member.uid === uid);
        const ready = professionalFiscalReady(mine);
        if (!ready.ok) {
          throw new Error(`Complete em Configurações: ${ready.missing.join(", ")}.`);
        }
        if (!mine || !isValidCpf(mine.cpf)) throw new Error("Informe um CPF válido em Configurações.");
        const payment = payments.find((item) => item.id === paymentId);
        if (!payment) throw new Error("Lançamento não encontrado.");
        if (!canIssueFiscalReceipt(payment)) throw new Error("Só é possível emitir recibo para pagamentos quitados.");
        if (payment.reciboFiscal && !options?.replace) {
          throw new Error("Este lançamento já tem recibo. Gere de novo se precisar substituir.");
        }
        const patient = payment.patientId ? patients.find((item) => item.id === payment.patientId) ?? null : null;
        if (patient) {
          const beneficiary = assertValidCpfOptional(patient.cpfBeneficiario || patient.cpf, "CPF do beneficiário");
          const payer = assertValidCpfOptional(patient.cpfPagador || beneficiary, "CPF do pagador");
          if (!beneficiary || !payer) {
            throw new Error("Informe CPF do pagador e do beneficiário na ficha do paciente (Receita Saúde).");
          }
        }
        const numero = payment.reciboFiscal?.numero || nextReceiptNumber(mine, payments);
        const paymentDate = paymentReceiptDate(payment);
        const blob = await createFiscalReceiptPdf({
          payment,
          patient,
          professional: mine,
          receiptNumber: numero,
          paymentDate,
        });
        const filename = fiscalReceiptFilename({
          payment,
          patient,
          professional: mine,
          receiptNumber: numero,
          paymentDate,
        });
        const file = new File([blob], filename, { type: "application/pdf" });
        const uploaded = await uploadClinicFile(file, { kind: "payment-receipt", paymentId }, "documento");
        const reciboFiscal = {
          numero,
          arquivo: uploaded,
          emitidoEm: new Date().toISOString(),
          dataPagamento: paymentDate,
          valor: receivedAmount(payment),
        };
        await updatePayment(paymentId, { reciboFiscal });
        if (numero > (mine.reciboSequencia || 0)) {
          await updateMember(mine.id, { reciboSequencia: numero });
        }
        toast.success(`Recibo nº ${numero} gerado.`);
        await refresh();
      },
      async saveContractTemplate(template) {
        const uid = currentUid();
        const mine = members.find((member) => member.uid === uid);
        if (!mine) throw new Error("Seu cadastro ainda não está na lista de profissionais. Saia e entre de novo.");
        await updateMember(mine.id, { contratoModelo: template });
        toast.success("Modelo de contrato salvo.");
        await refresh();
      },
      async saveSignedContract(patientId, file) {
        if (!patients.some((item) => item.id === patientId)) throw new Error("Paciente não encontrado.");
        await setPatientSignedContract(patientId, file);
        toast.success(file ? "Contrato assinado anexado." : "Contrato assinado removido.");
        await refresh();
      },
      async saveLocation(input, id) {
        const uid = currentUid();
        const mine = members.find((member) => member.uid === uid);
        if (!mine) throw new Error("Seu cadastro ainda não está na lista de profissionais. Saia e entre de novo.");
        if (!input.nome.trim()) throw new Error("Informe o nome do local.");
        const payload = {
          nome: input.nome.trim(),
          endereco: input.endereco.trim(),
          observacoes: input.observacoes.trim(),
        };
        if (id) {
          const current = locations.find((location) => location.id === id);
          if (!current) throw new Error("Local não encontrado.");
          if (current.createdByUid !== uid) throw new Error("Só quem criou este local pode editá-lo.");
          await updateLocation(id, payload);
          toast.success("Local atualizado.");
          await refresh();
          return id;
        }
        const created = await createLocation({ ...payload, memberIds: [mine.id], memberUids: [uid] }, uid);
        toast.success("Local de atendimento cadastrado.");
        await refresh();
        return created;
      },
      async lookupDirectoryUser(email) {
        return findDirectoryUser(email);
      },
      async sendLocationInvite(locationId, person) {
        const uid = currentUid();
        const location = locations.find((item) => item.id === locationId);
        if (!location) throw new Error("Salve o local antes de enviar o convite.");
        if (location.createdByUid !== uid) throw new Error("Só quem criou este local pode enviar convites.");
        const email = person.email.trim().toLowerCase();
        if (!person.uid || !email) throw new Error("Este usuário não foi encontrado na plataforma.");
        if (person.uid === uid) throw new Error("Este e-mail é o seu. O local já está vinculado a você.");
        if (location.memberUids.includes(person.uid)) throw new Error("Este profissional já participa deste local.");
        const pending = locationInvites.find(
          (invite) => invite.locationId === locationId && invite.inviteeUid === person.uid && invite.status === "pendente"
        );
        if (pending) throw new Error("Já existe um convite pendente para este profissional.");
        const mine = members.find((member) => member.uid === uid);
        const appointmentIds = appointments.filter((item) => item.locationId === locationId).map((item) => item.id);
        const expenseIds = expenses.filter((item) => item.locationId === locationId).map((item) => item.id);
        const viewers = Array.from(new Set([uid, ...location.memberUids]));
        for (const appointmentId of appointmentIds) await grantAccess("appointments", appointmentId, viewers);
        for (const expenseId of expenseIds) await grantAccess("expenses", expenseId, viewers);
        const inviteId = await createLocationInvite({
          locationId,
          locationNome: location.nome,
          ownerUid: uid,
          inviterNome: mine?.nome || "Profissional",
          inviteeUid: person.uid,
          inviteeEmail: email,
          inviteeNome: person.nome || email,
          appointmentIds,
          expenseIds,
        });
        const response = await fetch("/api/location-invite", {
          method: "POST",
          headers: await authorizedHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ inviteId }),
        });
        await refresh();
        if (!response.ok) {
          toast.warn("O convite ficou na página de notificações, mas o e-mail não foi enviado.");
          return;
        }
        toast.success("Convite enviado. O profissional precisa aceitar para participar do local.");
      },
      async answerLocationInvite(invite, status) {
        const uid = currentUid();
        if (invite.inviteeUid !== uid) throw new Error("Este convite não é seu.");
        if (invite.status !== "pendente") throw new Error("Este convite já foi respondido.");
        await setLocationInviteStatus(invite.id, status);
        if (status === "aceito") {
          await addLocationMemberUid(invite.locationId, uid);
          for (const appointmentId of invite.appointmentIds) {
            const appointment = appointments.find((item) => item.id === appointmentId);
            if (appointment && isBookableStart(appointment.date, appointment.startTime)) {
              await grantAccess("appointments", appointmentId, [uid]);
            }
          }
          for (const expenseId of invite.expenseIds) {
            await grantAccess("expenses", expenseId, [uid]);
          }
          toast.success("Convite aceito. O local, a agenda e as despesas foram compartilhados.");
        } else {
          toast.success("Convite recusado.");
        }
        await refresh();
      },
      async deleteLocation(id) {
        const uid = currentUid();
        const current = locations.find((location) => location.id === id);
        if (!current) throw new Error("Local não encontrado.");
        if (current.createdByUid !== uid) throw new Error("Só quem criou este local pode excluí-lo.");
        const inUse = appointments.some((item) => item.locationId === id && item.status !== "cancelado");
        if (inUse) {
          throw new Error("Este local ainda tem atendimentos. Cancele ou altere esses horários antes de excluir.");
        }
        await removeLocation(id);
        toast.success("Local excluído.");
        await refresh();
      },
      async setMemberActive(id, ativo) {
        await updateMember(id, { ativo });
        toast.success(ativo ? "Profissional reativado." : "Profissional desativado.");
        await refresh();
      },
      async saveExpense(input, id) {
        if (!input.descricao.trim()) throw new Error("Informe a descrição da despesa.");
        if (!input.valor || input.valor <= 0) throw new Error("Informe um valor maior que zero.");
        if (input.tipo === "variavel" && input.intervalo) {
          throw new Error("Conta variável não pode ser recorrente.");
        }
        if (input.tipo !== "parcelada" && !input.competencia) throw new Error("Informe a competência.");
        if (input.tipo === "fixo" && input.intervalo && !input.vencimento) {
          throw new Error("Informe o vencimento para repetir a despesa.");
        }
        if (input.tipo !== "parcelada" && input.vencimento && input.competencia && !input.vencimento.startsWith(input.competencia)) {
          throw new Error("O vencimento precisa estar no mês da competência.");
        }
        if (input.shares.some((share) => share.valor < 0)) throw new Error("O rateio não pode ter valor negativo.");
        if (input.shares.length > 0 && !sharesMatchTotal(input.valor, input.shares)) {
          throw new Error("A soma do rateio precisa ser igual ao valor da despesa.");
        }
        let payload = { ...input, descricao: input.descricao.trim() };
        if (payload.tipo === "parcelada") {
          if (!payload.inicio) throw new Error("Informe a data da primeira parcela.");
          if (!payload.intervalo) throw new Error("Informe se as parcelas são semanais, mensais ou anuais.");
          if (!Number.isInteger(payload.parcelas) || payload.parcelas < 1) throw new Error("Informe a quantidade de parcelas.");
          const current = id ? expenses.find((item) => item.id === id) : undefined;
          const alreadyPaid = current && current.tipo === "parcelada" ? Math.max(0, current.parcelas - current.parcelasRestantes) : 0;
          if (payload.parcelas < alreadyPaid) throw new Error("A quantidade não pode ser menor do que as parcelas já pagas.");
          const requestedRemaining = Math.max(0, Math.floor(payload.parcelasRestantes));
          const requestedPaid = payload.parcelas - requestedRemaining;
          const paid = Math.min(payload.parcelas, Math.max(alreadyPaid, requestedPaid));
          const dates = installmentDates(payload.inicio, payload.parcelas, payload.intervalo);
          const restantes = payload.parcelas - paid;
          payload = {
            ...payload,
            competencia: payload.inicio.slice(0, 7),
            vencimento: dates[Math.min(paid, Math.max(dates.length - 1, 0))] || payload.inicio,
            parcelasRestantes: restantes,
            paga: restantes === 0,
          };
        }
        const viewers = viewersFor(input.locationId);
        if (!id && payload.tipo === "fixo" && payload.intervalo && payload.vencimento) {
          const past = recurringDatesBefore(payload.vencimento, payload.intervalo);
          if (past.length > MAX_PAST_RECURRENCES) {
            throw new Error("Há mais de 36 vencimentos anteriores a hoje. Escolha uma data inicial mais recente.");
          }
          const dates = past.length > 0 ? past : [payload.vencimento];
          const serieId = payload.serieId || crypto.randomUUID();
          const paga = Boolean(payload.paga);
          for (const due of dates) {
            await createExpense(
              {
                ...payload,
                competencia: due.slice(0, 7),
                vencimento: due,
                paga,
                serieId,
                shares: payload.shares.map((share) => ({ ...share, paga })),
              },
              viewers
            );
          }
          toast.success(dates.length === 1 ? "Despesa lançada." : `${dates.length} despesas lançadas.`);
          await refresh();
          return;
        }
        if (id) await updateExpense(id, payload, viewers);
        else await createExpense(payload, viewers);
        toast.success(id ? "Despesa atualizada." : "Despesa lançada.");
        await refresh();
      },
      async payExpense(id) {
        const expense = expenses.find((item) => item.id === id);
        if (!expense) throw new Error("Despesa não encontrada.");
        if (expense.tipo === "parcelada") {
          if (expense.parcelasRestantes <= 0) throw new Error("Todas as parcelas já foram pagas.");
          const dates = installmentDates(expense.inicio, expense.parcelas, expense.intervalo || "mensal");
          const restantes = expense.parcelasRestantes - 1;
          const paid = expense.parcelas - restantes;
          await patchExpense(id, {
            parcelasRestantes: restantes,
            vencimento: dates[Math.min(paid, dates.length - 1)] || expense.vencimento,
            paga: restantes === 0,
          });
          toast.success(restantes === 0 ? "Última parcela paga." : "Parcela registrada. Resta uma a menos.");
        } else if (expense.shares.length > 1) {
          const uid = currentUid();
          const member = members.find((item) => item.uid === uid);
          const mine = expense.shares.find((share) => share.memberId === uid || (member ? share.memberId === member.id : false));
          if (!mine) throw new Error("Sua parte não está neste rateio.");
          if (mine.paga) throw new Error("Sua parte já está paga.");
          const shares = expense.shares.map((share) => (share.memberId === mine.memberId ? { ...share, paga: true } : share));
          const paga = shares.every((share) => share.paga);
          await patchExpense(id, { shares, paga, parcelasRestantes: expense.parcelasRestantes, vencimento: expense.vencimento });
          toast.success(paga ? "Todas as partes foram pagas." : "Sua parte foi registrada.");
        } else {
          if (!expense.vencimento) throw new Error("Defina o vencimento antes de marcar como paga.");
          if (expense.paga) throw new Error("Esta despesa já está paga.");
          const shares = expense.shares.map((share) => ({ ...share, paga: true }));
          await patchExpense(id, { paga: true, shares, parcelasRestantes: expense.parcelasRestantes, vencimento: expense.vencimento });
          toast.success("Despesa marcada como paga.");
        }
        await refresh();
      },
      async deleteExpense(id) {
        await removeExpense(id);
        toast.success("Despesa excluída.");
        await refresh();
      },
    };
  }, [appointments, expenses, loading, locationInvites, locationName, locations, memberName, members, notifications, packages, patientName, patients, payments, refresh, sessionFeedbacks]);

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (!context) throw new Error("useClinic deve ser usado dentro de ClinicProvider");
  return context;
}
