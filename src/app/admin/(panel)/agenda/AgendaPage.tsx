"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AppointmentForm from "@/components/admin/AppointmentForm";
import Select from "@/components/admin/Select";
import DayTimeline from "@/components/admin/DayTimeline";
import Drawer from "@/components/admin/Drawer";
import MonthCalendar from "@/components/admin/MonthCalendar";
import SetupNeeded from "@/components/admin/SetupNeeded";
import DayStrip from "@/components/admin/mobile/DayStrip";
import DesktopOnly from "@/components/admin/mobile/DesktopOnly";
import FloatingActionButton from "@/components/admin/mobile/FloatingActionButton";
import SegmentedControl from "@/components/admin/mobile/SegmentedControl";
import ListCard from "@/components/admin/mobile/ListCard";
import { ListSkeleton } from "@/components/admin/mobile/Skeleton";
import { Card, DataTable, Empty, MobileListGrid, PageTitle, Pill, ResponsiveTableWrap, Td, Th } from "@/components/admin/ui";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import {
  formatDate,
  labelAppointmentPlace,
  labelAppointmentStatus,
  labelSessionType,
  shiftDate,
  startOfWeek,
  todayISO,
} from "@/lib/admin/format";
import { fromMinutes, rangesOverlap, SLOT_STEP, timelineSlots, toMinutes, workRangesForDate } from "@/lib/admin/schedule";
import { memberWorkplaces } from "@/lib/admin/workplaces";
import type { Appointment } from "@/lib/admin/types";
import { getFirebaseAuth } from "@/lib/admin/firebase";

type Period = "hoje" | "semana" | "mes";

export default function AgendaPage({ locationId }: { locationId?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const dateParam = params.get("date");
  const initial = dateParam || todayISO();
  const { user } = useAuth();
  const { appointments, patients, members, locations, loading, patientName, memberName, locationName } = useClinic();
  const [period, setPeriod] = useState<Period>(locationId ? "hoje" : "mes");
  const [selected, setSelected] = useState(initial);
  const [month, setMonth] = useState(initial.slice(0, 7));
  const [placeId, setPlaceId] = useState(locationId || "");
  const [googleBusy, setGoogleBusy] = useState<{ startTime: string; endTime: string; label?: string }[]>([]);
  const currentMember = members.find(
    (member) => member.uid === user?.uid || member.email === user?.email?.toLowerCase()
  );
  const workplaces = memberWorkplaces(locations, currentMember, user?.uid);
  const requestedLocation = params.get("location") || "";
  const chosenLocation = locationId || placeId || requestedLocation;
  const activeLocationId = locations.some((item) => item.id === chosenLocation)
    ? chosenLocation
    : workplaces[0]?.id || "";

  useEffect(() => {
    if (locationId) setPlaceId(locationId);
  }, [locationId]);

  useEffect(() => {
    if (!dateParam) return;
    setSelected(dateParam);
    setMonth(dateParam.slice(0, 7));
  }, [dateParam]);

  useEffect(() => {
    let active = true;
    async function loadGoogleBusy() {
      const authUser = getFirebaseAuth().currentUser;
      if (!authUser) {
        if (active) setGoogleBusy([]);
        return;
      }
      try {
        const token = await authUser.getIdToken();
        const locationQuery = activeLocationId ? `&locationId=${encodeURIComponent(activeLocationId)}` : "";
        const response = await fetch(
          `/api/integrations/google-calendar/busy?from=${encodeURIComponent(selected)}&to=${encodeURIComponent(selected)}${locationQuery}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) {
          if (active) setGoogleBusy([]);
          return;
        }
        const data = (await response.json()) as {
          blocks?: { date: string; startTime: string; endTime: string; label?: string; masked?: boolean }[];
        };
        const blocks = (data.blocks || [])
          .filter((item) => item.date === selected)
          .map((item) => ({
            startTime: item.startTime,
            endTime: item.endTime,
            label: item.label || "Ocupado",
          }));
        if (active) setGoogleBusy(blocks);
      } catch {
        if (active) setGoogleBusy([]);
      }
    }
    void loadGoogleBusy();
    return () => {
      active = false;
    };
  }, [selected, user?.uid, activeLocationId]);

  useEffect(() => {
    if (locationId) return;
    if (window.matchMedia("(max-width: 767px)").matches) setPeriod("hoje");
  }, [locationId]);

  const creating = params.get("novo") === "1";
  const editId = params.get("edit");
  const editing = appointments.find((item) => item.id === editId);
  const drawerOpen = creating || Boolean(editing);

  const atLocation = useCallback(
    (item: Appointment) => Boolean(activeLocationId) && item.locationId === activeLocationId && item.status !== "cancelado",
    [activeLocationId]
  );

  const visible = useMemo(() => {
    return appointments
      .filter((item) => {
        if (!atLocation(item)) return false;
        if (period === "hoje") return item.date === selected;
        if (period === "semana") {
          const start = startOfWeek(selected);
          const end = shiftDate(start, 6);
          return item.date >= start && item.date <= end;
        }
        return item.date.startsWith(month);
      })
      .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  }, [appointments, atLocation, month, period, selected]);

  const marks = useMemo(() => {
    return appointments.reduce<Record<string, number>>((acc, item) => {
      if (!atLocation(item)) return acc;
      acc[item.date] = (acc[item.date] || 0) + 1;
      return acc;
    }, {});
  }, [appointments, atLocation]);

  function replaceQuery(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function selectDate(date: string) {
    setSelected(date);
    setMonth(date.slice(0, 7));
    replaceQuery({ date });
  }

  function closeDrawer() {
    replaceQuery({ novo: null, edit: null, patientId: null, online: null });
  }

  function openNew(time?: string, online = false) {
    replaceQuery({ novo: "1", edit: null, date: selected, time: time || null, patientId: null, online: online ? "1" : null });
  }

  const dayLocationAppointments = appointments
    .filter((item) => atLocation(item) && item.date === selected)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const dayAppointments = useMemo(() => {
    const own = appointments.filter(
      (item) =>
        item.date === selected &&
        item.status !== "cancelado" &&
        currentMember &&
        item.professionalId === currentMember.id
    );
    const byId = new Map<string, Appointment>();
    for (const item of [...dayLocationAppointments, ...own]) byId.set(item.id, item);
    return [...byId.values()].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, currentMember, dayLocationAppointments, selected]);

  const dayRanges = useMemo(() => {
    if (!currentMember?.workHours.length) return undefined;
    return workRangesForDate(currentMember.workHours, selected);
  }, [currentMember, selected]);

  const gridSlots = useMemo(() => timelineSlots(dayRanges), [dayRanges]);
  const outsideGrid = dayLocationAppointments.filter((item) => {
    if (gridSlots.length === 0) return true;
    return !gridSlots.some((slot) =>
      rangesOverlap(slot, fromMinutes(toMinutes(slot) + SLOT_STEP), item.startTime, item.endTime)
    );
  });

  if (loading) return <ListSkeleton rows={5} />;

  const missingPatient = patients.length === 0;
  const missingLocation = !locationId && workplaces.length === 0;
  if (missingPatient || missingLocation) {
    return <SetupNeeded title="Agenda" missingPatient={missingPatient} missingLocation={missingLocation} />;
  }

  const place = locations.find((item) => item.id === activeLocationId);
  const placeName = place?.nome || "Local removido";
  const professionalName = currentMember?.nome || "seu cadastro";
  const visiblePatient = (id: string) => (patients.some((patient) => patient.id === id) ? patientName(id) : "Ocupado");
  const visibleMember = (id: string | null) => {
    if (!id) return memberName(id);
    return members.some((member) => member.id === id) ? memberName(id) : "Outro profissional";
  };

  const newButton = (
    <button type="button" className="btn-primary" onClick={() => openNew()}>
      Novo atendimento
    </button>
  );

  return (
    <div className="relative admin-fab-pad">
      <FloatingActionButton label="Novo atendimento" onClick={() => openNew()} />
      {locationId ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-ink">Local em validação: {placeName}</p>
            <p className="mt-1 text-sm text-muted">
              Horários livres de {professionalName}. Atendimentos de outros profissionais neste local aparecem ocupados, inclusive sessão online feita no consultório.
            </p>
          </div>
          <DesktopOnly>{newButton}</DesktopOnly>
        </div>
      ) : (
        <PageTitle
          title="Agenda"
          subtitle={`Local em validação: ${placeName}. Horários livres de ${professionalName}.`}
          action={newButton}
        />
      )}
      {!locationId && workplaces.length > 1 && (
        <div className="mb-4 max-w-md">
          <Select
            value={activeLocationId}
            onChange={setPlaceId}
            options={workplaces.map((item) => ({ value: item.id, label: item.nome }))}
          />
        </div>
      )}
      <div className="mb-4 md:hidden">
        <SegmentedControl
          value={period}
          ariaLabel="Período da agenda"
          options={[
            { value: "hoje", label: "Hoje" },
            { value: "semana", label: "Semana" },
            { value: "mes", label: "Mês" },
          ]}
          onChange={setPeriod}
        />
      </div>
      <div className="mb-4 hidden flex-wrap gap-2 md:flex">
        {(
          [
            ["hoje", "Hoje"],
            ["semana", "Semana"],
            ["mes", "Mês"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setPeriod(value)}
            className={`${period === value ? "btn-chip-active" : "btn-chip"} w-full sm:w-auto`}
          >
            {label}
          </button>
        ))}
      </div>
      {(period === "hoje" || period === "semana") && (
        <div className="mb-4 md:hidden">
          <DayStrip selected={selected} marks={marks} onSelect={selectDate} />
        </div>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className={`max-lg:order-2 ${period === "hoje" || period === "semana" ? "max-md:hidden" : ""}`}>
          <p className="mb-3 text-sm text-ink">
            Marcações do local <strong>{placeName}</strong>
          </p>
          <MonthCalendar
            month={month}
            selected={selected}
            marks={marks}
            onMonth={(next) => {
              setMonth(next);
              setPeriod("mes");
            }}
            onSelect={(date) => {
              selectDate(date);
              if (period === "mes") setPeriod("hoje");
            }}
          />
        </Card>
        <Card className={`max-lg:order-1 ${period === "mes" ? "max-md:hidden" : ""}`} data-agenda-day-card>
          <h2 className="mb-1 text-2xl font-medium text-teal" data-agenda-selected-date>{formatDate(selected)}</h2>
          <p className="mb-1 text-sm font-medium text-ink">{placeName}</p>
          <p className="mb-4 text-sm text-muted">
            {dayRanges
              ? `Grade de ${professionalName}. Livre só quando você e este local estão disponíveis.`
              : `Das 7h às 21h, na grade de ${professionalName}.`}
          </p>
          <DayTimeline
            date={selected}
            appointments={dayAppointments}
            patientName={visiblePatient}
            memberName={visibleMember}
            locationName={locationName}
            showLocation
            viewLocationId={activeLocationId}
            professionalId={currentMember?.id || null}
            ranges={dayRanges}
            onPick={(time) => openNew(time)}
            onPickOnline={(time) => openNew(time, true)}
            externalBusy={googleBusy}
          />
          {outsideGrid.length > 0 && (
            <div className="mt-4 border-t border-[#e7eee8] pt-4">
              <p className="mb-2 text-sm font-medium text-ink">Também neste local, fora da sua grade</p>
              <div className="grid gap-1">
                {outsideGrid.map((item) => (
                  <Link key={item.id} href={`/admin/atendimentos/${item.id}`} className="rounded-md bg-sky-soft px-3 py-2 text-sm">
                    <strong>
                      {item.startTime}–{item.endTime}
                    </strong>{" "}
                    {visiblePatient(item.patientId)}
                    <span className="mt-0.5 block text-muted">
                      {visibleMember(item.professionalId)} · {labelAppointmentPlace(item.modality, placeName)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
      {period !== "hoje" && (
        <div className="mt-6">
        <Card>
          <h2 className="mb-4 text-2xl font-medium text-teal">
            {period === "semana" ? "Esta semana" : "Atendimentos do mês"}
          </h2>
          {visible.length === 0 ? (
            <Empty>Nenhum atendimento neste período.</Empty>
          ) : (
            <>
            <MobileListGrid>
              {visible.map((item) => (
                <ListCard
                  key={item.id}
                  href={`/admin/atendimentos/${item.id}`}
                  title={visiblePatient(item.patientId)}
                  subtitle={`${formatDate(item.date)} · ${item.startTime}–${item.endTime}`}
                  meta={
                    <Pill tone={item.status === "concluido" ? "teal" : item.status === "faltou" ? "accent" : "sage"}>
                      {labelAppointmentStatus(item.status)}
                    </Pill>
                  }
                />
              ))}
            </MobileListGrid>
            <ResponsiveTableWrap>
            <DataTable>
              <thead>
                <tr>
                  <Th>Data</Th>
                  <Th>Horário</Th>
                  <Th>Paciente</Th>
                  <Th>Profissional</Th>
                  <Th>Local</Th>
                  <Th>Sessão</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Ações</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id} className="hover:bg-paper">
                    <Td>{formatDate(item.date)}</Td>
                    <Td>
                      {item.startTime}–{item.endTime}
                    </Td>
                    <Td>
                      <Link href={`/admin/atendimentos/${item.id}`} className="font-medium text-teal">
                        {visiblePatient(item.patientId)}
                      </Link>
                    </Td>
                    <Td>{visibleMember(item.professionalId)}</Td>
                    <Td>{labelAppointmentPlace(item.modality, item.locationId ? locationName(item.locationId) : "")}</Td>
                    <Td>
                      {labelSessionType(item.sessionType)}
                      {item.recurring ? " · recorrente" : ""}
                    </Td>
                    <Td>
                      <Pill tone={item.status === "concluido" ? "teal" : item.status === "faltou" ? "accent" : "sage"}>
                        {labelAppointmentStatus(item.status)}
                      </Pill>
                    </Td>
                    <Td className="text-right">
                      <button type="button" className="btn-row" onClick={() => replaceQuery({ edit: item.id, novo: null })}>
                        Alterar
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            </ResponsiveTableWrap>
            </>
          )}
        </Card>
        </div>
      )}
      <Drawer
        open={drawerOpen}
        title={editing ? "Alterar atendimento" : "Novo atendimento"}
        onClose={closeDrawer}
      >
        {drawerOpen && (
          <AppointmentForm
            key={editing?.id || `novo-${params.get("date") || selected}-${params.get("time") || ""}-${params.get("patientId") || ""}-${activeLocationId}-${params.get("online") || ""}`}
            appointment={editing}
            initialDate={params.get("date") || selected}
            initialPatientId={params.get("patientId") || ""}
            initialLocationId={activeLocationId}
            initialStartTime={params.get("time") || ""}
            initialModality={params.get("online") === "1" ? "online" : undefined}
            lockLocation={Boolean(activeLocationId)}
            onSaved={closeDrawer}
          />
        )}
      </Drawer>
    </div>
  );
}
