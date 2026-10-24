"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useClinic } from "@/lib/admin/clinic-context";
import { useAuth } from "@/lib/admin/auth-context";
import { emptyClinical } from "@/lib/admin/types";
import type { Appointment, Modality, PackageInterval, SessionType } from "@/lib/admin/types";
import { roundMoney } from "@/lib/admin/finance";
import { formatDate, formatMoney, labelSessionType, moneyInput, shiftDate, todayISO } from "@/lib/admin/format";
import { maskPhone } from "@/lib/masks";
import { RECURRENCE_INTERVALS, packageIntervalDays, packageSessionDates, packageTypeLabel, pendingPackageSessions } from "@/lib/admin/packages";
import {
  addMinutes,
  findLocationConflict,
  findProfessionalConflict,
  fitsWorkHours,
  intervalDates,
  isBookableStart,
  recurrenceDates,
  slotStarts,
  toMinutes,
  workRangesForDate,
} from "@/lib/admin/schedule";
import { memberWorkplaces, userBelongsToLocation } from "@/lib/admin/workplaces";
import DateField from "./DateField";
import Select from "./Select";
import { Field, fieldClass } from "./ui";

const sessionTypes: SessionType[] = ["conhecimento", "padrao", "emergencial", "alta"];
const presetDurations = [30, 40, 50, 60];
const weekDays = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

function weekdayOf(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

function initialMinutes(appointment: Appointment | undefined, initialStartTime: string) {
  const start = appointment?.startTime || initialStartTime || "08:00";
  const end = appointment?.endTime || (initialStartTime ? addMinutes(initialStartTime, 50) : "08:50");
  const minutes = toMinutes(end) - toMinutes(start);
  return minutes > 0 ? minutes : 50;
}

export default function AppointmentForm({
  appointment,
  initialDate = "",
  initialPatientId = "",
  initialLocationId = "",
  initialStartTime = "",
  initialModality,
  lockLocation = false,
  onSaved,
}: {
  appointment?: Appointment;
  initialDate?: string;
  initialPatientId?: string;
  initialLocationId?: string;
  initialStartTime?: string;
  initialModality?: Modality;
  lockLocation?: boolean;
  onSaved?: (id: string) => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { patients, members, locations, appointments, packages, payments, saveAppointment, savePatient, createHaverPayments, memberName } =
    useClinic();
  const activePatients = useMemo(
    () => patients.filter((patient) => patient.status === "ativo" || patient.id === appointment?.patientId),
    [appointment?.patientId, patients]
  );
  const currentMember = members.find((member) => member.uid === user?.uid || member.email === user?.email?.toLowerCase());
  const start = appointment?.startTime || initialStartTime || "08:00";
  const minutesAtOpen = initialMinutes(appointment, initialStartTime);
  const [durationMode, setDurationMode] = useState<number | "custom">(
    presetDurations.includes(minutesAtOpen) ? minutesAtOpen : "custom"
  );
  const [customMinutes, setCustomMinutes] = useState(String(minutesAtOpen));
  const duration = durationMode === "custom" ? Number(customMinutes) : durationMode;
  const [form, setForm] = useState({
    patientId: appointment?.patientId || initialPatientId,
    professionalId: currentMember?.id || appointment?.professionalId || "",
    locationId: appointment?.locationId || initialLocationId,
    date: appointment?.date || initialDate,
    startTime: start,
    endTime: appointment?.endTime || addMinutes(start, minutesAtOpen),
    modality: (appointment?.modality || initialModality || "presencial") as Modality,
    sessionType: (appointment?.sessionType || "padrao") as SessionType,
    valor: appointment?.valor
      ? String(appointment.valor).replace(".", ",")
      : moneyInput(currentMember?.valorBase || 0),
    valorSocial: Boolean(appointment?.valorSocial),
    packageId: appointment?.packageId || "",
  });
  const [useOffice, setUseOffice] = useState(Boolean(appointment?.locationId) && appointment?.modality === "online");
  const [recurring, setRecurring] = useState(false);
  const [repeatEvery, setRepeatEvery] = useState<PackageInterval>("semanal");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [until, setUntil] = useState("");
  const [untilEdited, setUntilEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [offer, setOffer] = useState<null | { id: string; sessions: { id: string; date: string }[]; recurring: boolean }>(null);
  const [creatingHaver, setCreatingHaver] = useState(false);
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [savingPatient, setSavingPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ nome: "", telefone: "", email: "" });
  const [confirmedSuggestion, setConfirmedSuggestion] = useState<string | null>(null);
  const [cientePendentes, setCientePendentes] = useState(false);
  const [packagePayDate, setPackagePayDate] = useState("");
  const [sessionPayDate, setSessionPayDate] = useState("");

  const selectedPackage = packages.find((item) => item.id === form.packageId);
  const packageTotal = selectedPackage ? roundMoney((Number(form.valor.replace(",", ".")) || 0) * selectedPackage.sessoes) : 0;
  const packagePayment = payments.find(
    (payment) => payment.patientId === form.patientId && payment.packageId === form.packageId && payment.status !== "nao_pago"
  );

  useEffect(() => {
    if (!selectedPackage || selectedPackage.tipo === "personalizado") return;
    setRepeatEvery(selectedPackage.tipo);
    setRecurring(false);
  }, [selectedPackage?.id, selectedPackage?.tipo]);

  useEffect(() => {
    if (selectedPackage || !form.date || untilEdited) return;
    setUntil(shiftDate(form.date, 60));
  }, [form.date, selectedPackage, untilEdited]);
  const needsLocation = form.modality === "presencial" || useOffice;
  const workplaces = useMemo(
    () => memberWorkplaces(locations, currentMember, user?.uid),
    [currentMember, locations, user?.uid]
  );
  const soleWorkplace = workplaces.length === 1 ? workplaces[0] : null;
  const selectedLocation = locations.find((location) => location.id === form.locationId);
  const linkedToLocation = !selectedLocation || userBelongsToLocation(selectedLocation, currentMember, user?.uid);

  useEffect(() => {
    if (!currentMember || form.professionalId === currentMember.id) return;
    setForm((current) => ({ ...current, professionalId: currentMember.id }));
  }, [currentMember, form.professionalId]);

  useEffect(() => {
    if (lockLocation || !soleWorkplace || !needsLocation) return;
    setForm((current) => (current.locationId === soleWorkplace.id ? current : { ...current, locationId: soleWorkplace.id }));
  }, [lockLocation, needsLocation, soleWorkplace]);

  useEffect(() => {
    if (!Number.isFinite(duration) || duration <= 0) return;
    setForm((current) => ({ ...current, endTime: addMinutes(current.startTime, duration) }));
  }, [duration]);

  const workRanges = useMemo(
    () => (currentMember ? workRangesForDate(currentMember.workHours, form.date) : []),
    [currentMember, form.date]
  );
  const hasWorkHours = Boolean(currentMember?.workHours.length);
  function bookableStarts(minutes: number) {
    if (!form.date || !Number.isFinite(minutes) || minutes < 5) return [];
    if (hasWorkHours && workRanges.length === 0) return [];
    const options = slotStarts(minutes, hasWorkHours ? workRanges : undefined).filter((time) => isBookableStart(form.date, time));
    const ownDuration = appointment ? toMinutes(appointment.endTime) - toMinutes(appointment.startTime) : 0;
    if (appointment?.date === form.date && appointment.startTime && ownDuration === minutes && !options.includes(appointment.startTime)) {
      options.push(appointment.startTime);
    }
    return options.sort();
  }

  const starts = useMemo(
    () => bookableStarts(duration),
    [appointment?.date, appointment?.endTime, appointment?.startTime, duration, form.date, hasWorkHours, workRanges]
  );
  const durationFitsWindow = useMemo(() => {
    if (!Number.isFinite(duration) || duration < 5) return false;
    if (hasWorkHours && workRanges.length === 0) return false;
    return slotStarts(duration, hasWorkHours ? workRanges : undefined).length > 0;
  }, [duration, hasWorkHours, workRanges]);

  useEffect(() => {
    if (!form.date || durationMode === "custom" || starts.length > 0) return;
    const fallback = [...presetDurations].reverse().find((option) => bookableStarts(option).length > 0);
    if (fallback) setDurationMode(fallback);
  }, [durationMode, form.date, starts.length, hasWorkHours, workRanges]);

  useEffect(() => {
    if (!form.date || !Number.isFinite(duration) || duration <= 0 || starts.length === 0) return;
    if (starts.includes(form.startTime)) return;
    const next = starts[0];
    setForm((current) => ({ ...current, startTime: next, endTime: addMinutes(next, duration) }));
  }, [duration, form.date, form.startTime, starts]);

  const suggestion = useMemo(() => {
    if (!selectedPackage || selectedPackage.sessoes > 1 || !form.date || !form.startTime || recurring) return null;
    if (!Number.isFinite(duration) || duration < 5) return null;
    const endTime = addMinutes(form.startTime, duration);
    const date = shiftDate(form.date, packageIntervalDays(selectedPackage.tipo));
    const candidate = {
      date,
      startTime: form.startTime,
      endTime,
      modality: form.modality,
      locationId: needsLocation ? form.locationId || null : null,
      professionalId: currentMember?.id || null,
    };
    if (!fitsWorkHours(currentMember?.workHours || [], date, form.startTime, endTime)) {
      return { date, endTime, available: false, reason: "Esse dia e horário não estão na sua grade de atendimento." };
    }
    if (findProfessionalConflict(appointments, candidate, appointment?.id)) {
      return { date, endTime, available: false, reason: "Você já tem atendimento neste horário." };
    }
    if (findLocationConflict(appointments, candidate, appointment?.id)) {
      return { date, endTime, available: false, reason: "O local já está ocupado neste horário." };
    }
    return { date, endTime, available: true, reason: "" };
  }, [
    appointment?.id,
    appointments,
    currentMember,
    duration,
    form.date,
    form.locationId,
    form.modality,
    form.startTime,
    needsLocation,
    recurring,
    selectedPackage,
  ]);
  const suggestionKey = suggestion?.available
    ? `${suggestion.date}|${form.startTime}|${form.packageId}|${form.locationId}|${form.modality}`
    : null;
  const suggestionConfirmed = Boolean(suggestionKey && confirmedSuggestion === suggestionKey);
  const pendingSessions = useMemo(
    () => (form.patientId ? pendingPackageSessions(appointments, form.patientId, appointment?.id) : []),
    [appointment?.id, appointments, form.patientId]
  );
  const warnPending = pendingSessions.length > 0 && (!appointment || !form.packageId || form.packageId !== appointment.packageId);
  const bundle = useMemo(() => {
    if (!selectedPackage || selectedPackage.sessoes <= 1 || !form.date || !form.startTime || recurring) return [];
    return packageSessionDates(form.date, selectedPackage.tipo, selectedPackage.sessoes).map((date) => {
      if (date === form.date) return { date, ok: true, label: "Esta sessão" };
      const endTime = addMinutes(form.startTime, duration);
      if (!Number.isFinite(duration) || duration < 5) return { date, ok: false, label: "Duração inválida" };
      if (!isBookableStart(date, form.startTime)) return { date, ok: false, label: "Já passou" };
      if (currentMember?.workHours.length && !fitsWorkHours(currentMember.workHours, date, form.startTime, endTime)) {
        return { date, ok: false, label: "Fora da grade" };
      }
      const candidate = {
        date,
        startTime: form.startTime,
        endTime,
        modality: form.modality,
        locationId: needsLocation ? form.locationId || null : null,
        professionalId: currentMember?.id || null,
      };
      if (findProfessionalConflict(appointments, candidate, appointment?.id)) return { date, ok: false, label: "Ocupado na sua agenda" };
      if (findLocationConflict(appointments, candidate, appointment?.id)) return { date, ok: false, label: "Local ocupado" };
      return { date, ok: true, label: "Livre" };
    });
  }, [
    appointment?.id,
    appointments,
    currentMember,
    duration,
    form.date,
    form.locationId,
    form.modality,
    form.startTime,
    needsLocation,
    recurring,
    selectedPackage,
  ]);

  const seriesPreview = useMemo(() => {
    if (!recurring || !form.date || !until || until < form.date) return [];
    const dates =
      repeatEvery === "semanal"
        ? weekdays.length
          ? recurrenceDates(form.date, until, weekdays)
          : []
        : intervalDates(form.date, until, packageIntervalDays(repeatEvery));
    return dates.map((date) => {
      if (date === form.date) return { date, ok: true, label: "Esta sessão" };
      const endTime = addMinutes(form.startTime, duration);
      if (!Number.isFinite(duration) || duration < 5) return { date, ok: false, label: "Duração inválida" };
      if (!isBookableStart(date, form.startTime)) return { date, ok: false, label: "Já passou" };
      if (currentMember?.workHours.length && !fitsWorkHours(currentMember.workHours, date, form.startTime, endTime)) {
        return { date, ok: false, label: "Fora da grade" };
      }
      const candidate = {
        date,
        startTime: form.startTime,
        endTime,
        modality: form.modality,
        locationId: needsLocation ? form.locationId || null : null,
        professionalId: currentMember?.id || null,
      };
      if (findProfessionalConflict(appointments, candidate, appointment?.id)) {
        return { date, ok: false, label: "Ocupado na sua agenda" };
      }
      if (findLocationConflict(appointments, candidate, appointment?.id)) {
        return { date, ok: false, label: "Local ocupado" };
      }
      return { date, ok: true, label: "Livre" };
    });
  }, [
    appointment?.id,
    appointments,
    currentMember,
    duration,
    form.date,
    form.locationId,
    form.modality,
    form.startTime,
    needsLocation,
    recurring,
    repeatEvery,
    until,
    weekdays,
  ]);

  useEffect(() => {
    if (appointment || !currentMember) return;
    setForm((current) => {
      if (current.valor) return current;
      const amount = current.valorSocial ? currentMember.valorSocial : currentMember.valorBase;
      if (!amount) return current;
      return { ...current, valor: moneyInput(amount) };
    });
  }, [appointment, currentMember]);

  async function registerPatient() {
    if (!newPatient.nome.trim() || !newPatient.telefone.trim()) {
      toast.error("Informe o nome e o telefone do paciente.");
      return;
    }
    setSavingPatient(true);
    try {
      const id = await savePatient({
        nome: newPatient.nome,
        telefone: newPatient.telefone,
        email: newPatient.email,
        cpf: "",
        cpfPagador: "",
        cpfBeneficiario: "",
        nascimento: "",
        endereco: "",
        contatoEmergencia: "",
        observacoes: "",
        foto: "",
        status: "ativo",
      });
      setForm((current) => ({ ...current, patientId: id }));
      setNewPatient({ nome: "", telefone: "", email: "" });
      setNewPatientOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cadastrar o paciente.");
    } finally {
      setSavingPatient(false);
    }
  }

  function chooseDuration(next: number | "custom") {
    setDurationMode(next);
  }

  function chooseSlot(time: string) {
    const minutes = Number.isFinite(duration) && duration > 0 ? duration : 50;
    setForm((current) => ({ ...current, startTime: time, endTime: addMinutes(time, minutes) }));
  }

  function finish(id: string) {
    if (onSaved) onSaved(id);
    else router.push(`/admin/atendimentos/${id}`);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!currentMember) {
      toast.error("Seu cadastro de profissional ainda não está disponível. Saia e entre de novo.");
      return;
    }
    if (!Number.isFinite(duration) || duration < 5 || duration > 480) {
      toast.error("Informe um tempo de sessão entre 5 e 480 minutos.");
      return;
    }
    const valor = Number(form.valor.replace(",", "."));
    if (!valor || valor <= 0) {
      toast.error("Informe o valor da sessão.");
      return;
    }
    if (needsLocation && !form.locationId) {
      toast.error("Selecione o local de atendimento.");
      return;
    }
    if (needsLocation && selectedLocation && !userBelongsToLocation(selectedLocation, currentMember, user?.uid)) {
      toast.error("Você não está vinculado a este local de atendimento.");
      return;
    }
    if (warnPending && !cientePendentes) {
      toast.error("Este paciente ainda tem sessões de pacote pendentes. Confirme o alerta para continuar.");
      return;
    }
    setSaving(true);
    try {
      const saved = await saveAppointment(
        {
          patientId: form.patientId,
          professionalId: currentMember.id,
          locationId: needsLocation ? form.locationId || null : null,
          date: form.date,
          startTime: form.startTime,
          endTime: addMinutes(form.startTime, duration),
          modality: form.modality,
          sessionType: form.sessionType,
          valor,
          valorSocial: form.valorSocial,
          packageId: form.packageId || null,
          packageVersao: appointment?.packageId === form.packageId ? appointment?.packageVersao || null : null,
          faltaJustificativa: appointment?.faltaJustificativa || "",
          status: appointment?.status || "agendado",
          clinical: appointment?.clinical || emptyClinical(),
          recurring: Boolean(appointment?.recurring || (!appointment && recurring)),
          seriesId: appointment?.seriesId || null,
        },
        appointment?.id,
        !appointment && recurring ? { interval: repeatEvery, weekdays, until } : undefined,
        bundle.some((item) => item.date !== form.date && item.ok)
          ? bundle.filter((item) => item.date !== form.date && item.ok).map((item) => item.date)
          : suggestionConfirmed && suggestion
            ? [suggestion.date]
            : undefined
      );
      if (appointment) {
        finish(saved.id);
        return;
      }
      const today = todayISO();
      const limit = shiftDate(today, 60);
      const sessions = recurring
        ? saved.sessions.filter((session) => session.date >= today && session.date <= limit)
        : saved.sessions;
      setSessionPayDate(form.date);
      setOffer({ id: saved.id, sessions, recurring });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmHaver() {
    if (!offer) return;
    setCreatingHaver(true);
    try {
      const valor = Number(form.valor.replace(",", "."));
      if (selectedPackage) {
        if (!packagePayDate) {
          toast.error("Informe a data de pagamento do pacote.");
          return;
        }
        const count = await createHaverPayments(offer.sessions, {
          patientId: form.patientId,
          valor,
          valorSocial: false,
          packageCharge: {
            packageId: selectedPackage.id,
            nome: selectedPackage.nome,
            sessoes: selectedPackage.sessoes,
            dueDate: packagePayDate,
          },
        });
        finish(offer.id);
        return;
      }
      if (offer.sessions.length === 1 && !offer.recurring && !sessionPayDate) {
        toast.error("Informe a data do pagamento.");
        return;
      }
      const count = await createHaverPayments(offer.sessions, {
        patientId: form.patientId,
        valor,
        valorSocial: form.valorSocial,
        dueDate: offer.sessions.length === 1 && !offer.recurring ? sessionPayDate : undefined,
      });
      if (count === 0) toast.info("Nenhuma sessão para lançar em haver.");
      finish(offer.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível lançar em haver.");
    } finally {
      setCreatingHaver(false);
    }
  }

  const haverLimit = shiftDate(todayISO(), 60);

  useEffect(() => {
    if (!offer) return;
    function keepOpen(event: KeyboardEvent) {
      if (event.key === "Escape") event.stopPropagation();
    }
    document.addEventListener("keydown", keepOpen, true);
    return () => document.removeEventListener("keydown", keepOpen, true);
  }, [offer]);

  return (
    <>
      <form onSubmit={onSubmit} className="grid gap-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-ink">Paciente</span>
            <button
              type="button"
              className="text-sm font-semibold text-teal underline-offset-2 hover:underline"
              onClick={() => setNewPatientOpen((open) => !open)}
            >
              {newPatientOpen ? "Usar paciente já cadastrado" : "Cadastrar novo"}
            </button>
          </div>
          {newPatientOpen ? (
            <div className="grid gap-3 rounded-md bg-paper p-4">
              <p className="text-sm text-muted">Nome e telefone bastam para incluir o paciente neste atendimento.</p>
              <Field label="Nome">
                <input
                  className={fieldClass}
                  value={newPatient.nome}
                  onChange={(event) => setNewPatient((current) => ({ ...current, nome: event.target.value }))}
                />
              </Field>
              <Field label="Telefone">
                <input
                  className={fieldClass}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                  value={newPatient.telefone}
                  onChange={(event) => setNewPatient((current) => ({ ...current, telefone: maskPhone(event.target.value) }))}
                />
              </Field>
              <Field label="E-mail">
                <input
                  type="email"
                  className={fieldClass}
                  value={newPatient.email}
                  onChange={(event) => setNewPatient((current) => ({ ...current, email: event.target.value }))}
                />
              </Field>
              <button type="button" className="btn-primary justify-self-start" disabled={savingPatient} onClick={registerPatient}>
                {savingPatient ? "Cadastrando..." : "Incluir paciente"}
              </button>
            </div>
          ) : (
            <Select
              required
              value={form.patientId}
              onChange={(next) => setForm({ ...form, patientId: next })}
              options={[
                { value: "", label: "Selecione" },
                ...activePatients.map((patient) => ({ value: patient.id, label: patient.nome })),
              ]}
            />
          )}
        </div>
        <Field label="Pacote">
          <Select
            value={form.packageId}
            onChange={(next) => {
              const pack = packages.find((item) => item.id === next);
              setForm({
                ...form,
                packageId: next,
                valor: appointment?.packageId === next ? moneyInput(appointment.valor) : pack ? moneyInput(pack.valorSessao) : form.valor,
                valorSocial: next ? false : form.valorSocial,
              });
            }}
            options={[
              { value: "", label: "Sem pacote" },
              ...packages
                .filter((item) => !item.arquivado || item.id === appointment?.packageId)
                .map((item) => ({
                  value: item.id,
                  label: `${item.nome} · ${packageTypeLabel(item.tipo)} · ${item.sessoes} sessões · v${item.versao}${item.arquivado ? " · arquivado" : ""}`,
                })),
            ]}
          />
          {selectedPackage && (
            <p className="mt-2 text-sm text-muted">
              {packageTypeLabel(selectedPackage.tipo)}, versão {selectedPackage.versao}: {selectedPackage.sessoes} {selectedPackage.sessoes === 1 ? "sessão" : "sessões"} em {packageIntervalDays(selectedPackage.tipo)} dias. Cada sessão vale {formatMoney(selectedPackage.valorSessao)}. O lançamento no financeiro é o total de {formatMoney(packageTotal)}, com a data de pagamento escolhida para este paciente.
            </p>
          )}
        </Field>
        <Field label="Data">
          <DateField value={form.date} onChange={(date) => setForm({ ...form, date })} required />
        </Field>
        {form.date ? (
          <>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink">Duração do atendimento</span>
              <div className="flex flex-wrap gap-2">
                {presetDurations.map((option) => {
                  const fits = bookableStarts(option).length > 0;
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={!fits}
                      title={fits ? undefined : "Termina depois do horário máximo de atendimento"}
                      onClick={() => chooseDuration(option)}
                      className={durationMode === option ? "btn-chip-active" : "btn-chip"}
                    >
                      {option} min
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => chooseDuration("custom")}
                  className={durationMode === "custom" ? "btn-chip-active" : "btn-chip"}
                >
                  Personalizado
                </button>
              </div>
              {durationMode === "custom" && (
                <div className="mt-3">
                  <Field label="Minutos">
                    <input
                      className={fieldClass}
                      inputMode="numeric"
                      min={5}
                      max={480}
                      value={customMinutes}
                      onChange={(event) => setCustomMinutes(event.target.value.replace(/\D/g, ""))}
                      required
                    />
                  </Field>
                </div>
              )}
            </div>
            <div>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-ink">Horário do atendimento</span>
                {starts.includes(form.startTime) && Number.isFinite(duration) && duration > 0 && (
                  <span className="text-sm text-muted">
                    {form.startTime}–{addMinutes(form.startTime, duration)}
                  </span>
                )}
              </div>
              {needsLocation && !form.locationId ? (
                <p className="rounded-md bg-paper px-4 py-3 text-sm text-muted">
                  Escolha o local para ver quais horários estão livres.
                </p>
              ) : needsLocation && !linkedToLocation ? (
                <p className="rounded-md bg-paper px-4 py-3 text-sm text-muted">
                  Você não está vinculado a este local. Peça para quem criou o local incluir seu cadastro.
                </p>
              ) : hasWorkHours && workRanges.length === 0 ? (
                <p className="rounded-md bg-paper px-4 py-3 text-sm text-muted">
                  Você não atende neste dia. Inclua o horário em Configurações.
                </p>
              ) : starts.length === 0 ? (
                <p className="rounded-md bg-paper px-4 py-3 text-sm text-muted">
                  {durationFitsWindow
                    ? "Não há mais horários livres neste dia."
                    : "Essa duração termina depois do horário máximo de atendimento."}
                </p>
              ) : (
                <div className="grid max-h-64 gap-1.5 overflow-y-auto rounded-md border border-[#e2e8ea] p-1.5">
                  {starts.map((time) => {
                    const endTime = addMinutes(time, duration);
                    const candidate = {
                      date: form.date,
                      startTime: time,
                      endTime,
                      modality: form.modality,
                      locationId: needsLocation ? form.locationId : null,
                      professionalId: currentMember?.id || null,
                    };
                    const locationConflict = findLocationConflict(appointments, candidate, appointment?.id);
                    const professionalConflict = findProfessionalConflict(appointments, candidate, appointment?.id);
                    const blocked = Boolean(locationConflict || professionalConflict);
                    const selected = form.startTime === time;
                    const occupant = locationConflict
                      ? members.some((member) => member.id === locationConflict.professionalId)
                        ? memberName(locationConflict.professionalId)
                        : "Outro profissional"
                      : "";
                    const reason = locationConflict
                      ? `Ocupado · ${occupant}`
                      : professionalConflict
                        ? "Ocupado na sua agenda"
                        : form.modality === "online" && !needsLocation
                          ? "Disponível para online"
                          : form.modality === "online"
                            ? "Livre · Online neste local"
                            : "Livre";
                    return (
                      <button
                        key={time}
                        type="button"
                        disabled={blocked}
                        onClick={() => chooseSlot(time)}
                        className={`flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm ${
                          selected
                            ? "bg-teal text-white"
                            : blocked
                              ? "cursor-not-allowed text-muted"
                              : "text-ink hover:bg-sky-soft"
                        }`}
                      >
                        <span className="font-medium">
                          {time} – {endTime}
                        </span>
                        <span className={`text-xs ${selected ? "text-white/80" : "text-muted"}`}>{reason}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {starts.length > 0 && !(needsLocation && !form.locationId) && !(needsLocation && !linkedToLocation) && !(hasWorkHours && workRanges.length === 0) && (
                <p className="mt-2 text-sm text-muted">
                  {needsLocation
                    ? "Ocupado inclui sessão online feita neste consultório."
                    : "Online sem local não ocupa o consultório."}
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="rounded-md bg-paper px-4 py-3 text-sm text-muted">
            Escolha a data para ver a duração e os horários.
          </p>
        )}
        <Field label="Modalidade">
          <Select
            value={form.modality}
            onChange={(next) => {
              const modality = next as Modality;
              setForm({ ...form, modality });
              if (modality === "presencial") setUseOffice(false);
            }}
            options={[
              { value: "presencial", label: "Presencial" },
              { value: "online", label: "Online" },
            ]}
          />
        </Field>
        {form.modality === "online" && (
          <label className="flex items-start gap-3 rounded-md bg-paper px-4 py-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={useOffice}
              onChange={(event) => setUseOffice(event.target.checked)}
            />
            <span>
              <strong className="font-medium">Usar o local de atendimento</strong>
              <span className="mt-1 block text-muted">
                Algumas sessões online acontecem no consultório. O horário fica ocupado nesse local para os outros profissionais.
              </span>
            </span>
          </label>
        )}
        {needsLocation && (
          <Field label="Local de atendimento">
            {soleWorkplace && !lockLocation ? (
              <input className={`${fieldClass} bg-paper text-muted`} value={soleWorkplace.nome} disabled />
            ) : (
              <Select
                required
                value={form.locationId || ""}
                disabled={lockLocation || Boolean(soleWorkplace)}
                onChange={(next) => setForm({ ...form, locationId: next })}
                options={[
                  { value: "", label: "Selecione" },
                  ...(soleWorkplace ? [soleWorkplace] : workplaces).map((location) => ({ value: location.id, label: location.nome })),
                ]}
              />
            )}
          </Field>
        )}
        <Field label="Profissional">
          <input className={`${fieldClass} bg-paper text-muted`} value={currentMember?.nome || "Carregando seu cadastro..."} disabled />
        </Field>
        {selectedPackage && form.date && !recurring && suggestion && (
          <div className="rounded-md border border-[#d7e0d8] bg-paper px-4 py-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">Próximo atendimento</p>
            {suggestion.available ? (
              <>
                <p className="mt-2 text-ink">
                  Sugestão: {formatDate(suggestion.date)} · {form.startTime}–{suggestion.endTime}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {packageTypeLabel(selectedPackage.tipo)} soma {packageIntervalDays(selectedPackage.tipo)} dias a este atendimento. Esse dia está na sua grade e o horário está livre.
                </p>
                {suggestionConfirmed ? (
                  <button type="button" className="btn-text mt-3" onClick={() => setConfirmedSuggestion(null)}>
                    Desfazer sugestão
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary mt-3"
                    onClick={() => suggestionKey && setConfirmedSuggestion(suggestionKey)}
                  >
                    Confirmar sugestão
                  </button>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">
                O próximo atendimento cairia em {formatDate(suggestion.date)} · {form.startTime}–{suggestion.endTime}. {suggestion.reason}
              </p>
            )}
          </div>
        )}
        <Field label="Tipo de sessão">
          <Select
            value={form.sessionType}
            onChange={(next) => setForm({ ...form, sessionType: next as SessionType })}
            options={sessionTypes.map((type) => ({ value: type, label: labelSessionType(type) }))}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="Valor da sessão">
            <input
              className={fieldClass}
              inputMode="decimal"
              value={form.valor}
              onChange={(event) => setForm({ ...form, valor: event.target.value })}
              placeholder="0,00"
              disabled={Boolean(form.packageId)}
              required
            />
          </Field>
          <label className="flex items-center gap-3 pb-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.valorSocial}
              disabled={Boolean(form.packageId)}
              onChange={(event) => {
                const checked = event.target.checked;
                const amount = checked ? currentMember?.valorSocial : currentMember?.valorBase;
                setForm({
                  ...form,
                  valorSocial: checked,
                  valor: amount ? moneyInput(amount) : form.valor,
                });
              }}
            />
            Valor social
          </label>
        </div>
        <div className="rounded-md bg-paper p-4">
          {appointment ? (
            <p className="text-sm text-muted">
              {appointment.recurring
                ? "Esta sessão faz parte de uma recorrência. Alterar aqui muda só este horário."
                : "Sessão única. Nenhum horário seguinte foi gerado a partir desta."}
            </p>
          ) : (
            <>
              {selectedPackage ? (
                <div className="grid gap-4">
                  <div>
                    <span className="mb-1.5 block text-sm font-medium text-ink">Recorrência do pacote</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedPackage.tipo === "personalizado" ? (
                        <button type="button" className="btn-chip-active" disabled>
                          Personalizado
                        </button>
                      ) : (
                        RECURRENCE_INTERVALS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            disabled
                            className={option.value === selectedPackage.tipo ? "btn-chip-active" : "btn-chip"}
                          >
                            {option.label}
                          </button>
                        ))
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      O intervalo fica travado no pacote. As sessões seguintes usam a data escolhida acima, conforme a agenda, o local e o horário de atendimento.
                    </p>
                  </div>
                  {bundle.length > 1 && (
                    <div>
                      <span className="mb-1.5 block text-sm font-medium text-ink">Sessões do pacote</span>
                      <div className="grid max-h-52 gap-1 overflow-y-auto">
                        {bundle.map((item) => (
                          <div key={item.date} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm">
                            <span className="font-medium">{formatDate(item.date)}</span>
                            <span className={item.ok ? "text-xs text-muted" : "text-xs text-accent"}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
              <>
              <label className="flex items-center gap-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setRecurring(checked);
                    if (checked && form.date && weekdays.length === 0) setWeekdays([weekdayOf(form.date)]);
                    if (checked && form.date && !untilEdited) setUntil(shiftDate(form.date, 60));
                  }}
                />
                Sessão recorrente
              </label>
              <p className="mt-2 text-sm text-muted">
                O mesmo horário se repete até a data final. Escolha se a repetição é semanal, quinzenal ou mensal.
              </p>
              {recurring && (
                <div className="mt-4 grid gap-4">
                  <div>
                    <span className="mb-1.5 block text-sm font-medium text-ink">Repetir</span>
                    <div className="flex flex-wrap gap-2">
                      {RECURRENCE_INTERVALS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setRepeatEvery(option.value)}
                          className={repeatEvery === option.value ? "btn-chip-active" : "btn-chip"}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {repeatEvery === "semanal" && (
                    <div>
                      <span className="mb-1.5 block text-sm font-medium text-ink">Dias da semana</span>
                      <div className="flex flex-wrap gap-2">
                        {weekDays.map((day) => {
                          const active = weekdays.includes(day.value);
                          return (
                            <button
                              key={day.label}
                              type="button"
                              onClick={() =>
                                setWeekdays((current) =>
                                  current.includes(day.value) ? current.filter((value) => value !== day.value) : [...current, day.value]
                                )
                              }
                              className={active ? "btn-chip-active" : "btn-chip"}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <Field label="Repetir até">
                    <DateField
                      value={until}
                      min={form.date}
                      onChange={(next) => {
                        setUntilEdited(true);
                        setUntil(next);
                      }}
                      required
                    />
                    <p className="mt-2 text-sm text-muted">Preenchido com 60 dias após a primeira sessão. Datas fora da grade, do local ou da agenda não são marcadas.</p>
                  </Field>
                  {seriesPreview.length > 0 && (
                    <div>
                      <span className="mb-1.5 block text-sm font-medium text-ink">Datas sugeridas</span>
                      <div className="grid max-h-52 gap-1 overflow-y-auto">
                        {seriesPreview.map((item) => (
                          <div key={item.date} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm">
                            <span className="font-medium">{formatDate(item.date)}</span>
                            <span className={item.ok ? "text-xs text-muted" : "text-xs text-accent"}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                      {seriesPreview.length > 48 && (
                        <p className="mt-2 text-sm text-accent">Essa recorrência passa de 48 sessões. Encurte o período.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              </>
              )}
            </>
          )}
        </div>
        {warnPending && (
          <div className="rounded-md border border-[#e8cfc4] bg-[#f6e6df] px-4 py-3 text-sm">
            <p className="font-medium text-accent">Este paciente ainda tem sessões de pacote pendentes.</p>
            <p className="mt-1 text-ink">
              {pendingSessions.map((item) => `${formatDate(item.date)} · ${item.startTime}`).join(", ")}. Um atendimento avulso ou outro pacote fica fora dessas sessões.
            </p>
            <label className="mt-3 flex items-center gap-3 font-medium">
              <input type="checkbox" checked={cientePendentes} onChange={(event) => setCientePendentes(event.target.checked)} />
              Estou ciente e quero continuar
            </label>
          </div>
        )}
        <button className="btn-primary w-full sm:w-auto" type="submit" disabled={saving || Boolean(offer) || (warnPending && !cientePendentes)}>
          {saving
            ? "Salvando..."
            : suggestionConfirmed
              ? appointment
                ? "Salvar e confirmar a próxima sessão"
                : "Agendar atendimento e a próxima sessão"
              : appointment
                ? "Salvar alterações"
                : "Agendar atendimento"}
        </button>
      </form>
      {offer &&
        createPortal(
          <div className="sheet-host fixed inset-0 z-[90] grid place-items-center bg-ink/40 p-4">
            <div className="sheet-panel w-full max-w-md overflow-y-auto rounded-md bg-white p-5 shadow-[0_18px_50px_rgba(61,82,64,0.18)] sm:p-6" role="dialog" aria-modal="true">
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">Financeiro</p>
              <h2 className="mt-2 font-serif text-[clamp(1.5rem,5vw,1.875rem)] leading-tight text-teal">Lançar em haver?</h2>
              <p className="mt-3 leading-relaxed text-muted">
                {selectedPackage
                  ? "O atendimento foi salvo. O pacote entra no financeiro como um único pagamento, no valor total."
                  : offer.recurring
                    ? "O atendimento foi salvo. Só o próximo atendimento fica em haver. As outras sessões entram como agendadas, para não parecerem atraso nem valor a receber agora."
                    : "O atendimento foi salvo. Deseja gerar um registro no Financeiro, em haver, para as sessões deste paciente?"}
              </p>
              {selectedPackage ? (
                packagePayment ? (
                  <p className="mt-3 text-sm leading-relaxed text-ink">
                    Este paciente já tem o pagamento de {selectedPackage.nome} em {formatDate(packagePayment.dueDate)}, no valor de {formatMoney(packagePayment.valorAcordado || packagePayment.valor)}. As sessões deste pacote não geram outro lançamento.
                  </p>
                ) : (
                  <div className="mt-4 grid gap-3">
                    <p className="text-sm leading-relaxed text-ink">
                      {selectedPackage.sessoes} {selectedPackage.sessoes === 1 ? "sessão" : "sessões"} de {formatMoney(Number(form.valor.replace(",", ".")) || 0)}. O valor total, já com o desconto do pacote, é {formatMoney(packageTotal)}.
                    </p>
                    <Field label="Data de pagamento do pacote">
                      <DateField value={packagePayDate} onChange={setPackagePayDate} zIndex={120} required />
                    </Field>
                    <p className="text-sm text-muted">Esta data fica como o pagamento de {selectedPackage.nome} para este paciente.</p>
                  </div>
                )
              ) : (
                <div className="mt-3 grid gap-3">
                  <p className="text-sm leading-relaxed text-ink">
                    {offer.recurring
                      ? offer.sessions.length === 0
                        ? `Nenhuma sessão desta recorrência cai nos próximos 60 dias, até ${haverLimit.split("-").reverse().join("/")}.`
                        : `Serão lançadas ${offer.sessions.length} ${offer.sessions.length === 1 ? "sessão" : "sessões"} dos próximos 60 dias, cada uma de ${formatMoney(Number(form.valor.replace(",", ".")) || 0)}${form.valorSocial ? ", como valor social" : ""}. Apenas a próxima fica em haver.`
                      : offer.sessions.length > 1
                        ? `Serão lançadas ${offer.sessions.length} sessões, cada uma de ${formatMoney(Number(form.valor.replace(",", ".")) || 0)}, incluindo a sugestão confirmada.`
                        : `Será lançada esta sessão, de ${formatMoney(Number(form.valor.replace(",", ".")) || 0)}${form.valorSocial ? ", como valor social" : ""}.`}
                  </p>
                  {offer.sessions.length === 1 && !offer.recurring && (
                    <Field label="Data do pagamento">
                      <DateField value={sessionPayDate} onChange={setSessionPayDate} zIndex={120} required />
                      <p className="mt-2 text-sm text-muted">A data do atendimento já vem preenchida. Você pode alterá-la.</p>
                    </Field>
                  )}
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                {selectedPackage && packagePayment ? (
                  <button className="btn-primary" type="button" onClick={() => finish(offer.id)}>
                    Continuar
                  </button>
                ) : (
                <button
                  className="btn-primary"
                  type="button"
                  disabled={creatingHaver || (selectedPackage ? !packagePayDate : offer.sessions.length === 0 || (offer.sessions.length === 1 && !offer.recurring && !sessionPayDate))}
                  onClick={confirmHaver}
                >
                  {creatingHaver ? "Gerando..." : selectedPackage ? "Lançar pagamento do pacote" : offer.recurring ? "Gerar lançamentos" : "Gerar em haver"}
                </button>
                )}
                <button className="btn-text" type="button" disabled={creatingHaver} onClick={() => finish(offer.id)}>
                  Agora não
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
