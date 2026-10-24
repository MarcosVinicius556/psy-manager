"use client";

import { useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import MonthCalendar from "@/components/admin/MonthCalendar";
import MonthTotalCard from "@/components/admin/MonthTotalCard";
import Select from "@/components/admin/Select";
import ListCard from "@/components/admin/mobile/ListCard";
import StackedRow from "@/components/admin/mobile/StackedRow";
import { Card, DataTable, Empty, MobileListGrid, Pill, ResponsiveTableWrap, Td, Th, WidgetSectionFooter, WidgetSectionTitle } from "@/components/admin/ui";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import type { WidgetId } from "@/lib/admin/dashboard-layout";
import {
  earliestOverdueMonth,
  earliestReceivedMonth,
  isExternalPayment,
  isFutureLaunch,
  latestDueMonth,
  overdueInMonth,
  receivableInMonth,
  receivedInMonth,
  remainingAmount,
  unpaidPatients,
} from "@/lib/admin/finance";
import { addMonths, formatDate, formatMoney, labelAppointmentPlace, labelAppointmentStatus, todayISO } from "@/lib/admin/format";
import { memberWorkplaces } from "@/lib/admin/workplaces";

function useClinicPayments() {
  const { payments } = useClinic();
  return useMemo(() => payments.filter((payment) => !isExternalPayment(payment)), [payments]);
}

function useDebtors() {
  const { patients } = useClinic();
  const clinicPayments = useClinicPayments();
  return useMemo(() => unpaidPatients(patients, clinicPayments), [patients, clinicPayments]);
}

function ReceivableWidget() {
  const clinicPayments = useClinicPayments();
  const currentMonth = todayISO().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  return (
    <MonthTotalCard
      title="Total a receber"
      month={month}
      minMonth={currentMonth}
      maxMonth={latestDueMonth(clinicPayments, currentMonth)}
      value={receivableInMonth(clinicPayments, month)}
      previous={receivableInMonth(clinicPayments, addMonths(month, -1))}
      onMonth={setMonth}
    />
  );
}

function OverdueWidget() {
  const clinicPayments = useClinicPayments();
  const today = todayISO();
  const currentMonth = today.slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  return (
    <MonthTotalCard
      title="Total em atraso"
      month={month}
      minMonth={earliestOverdueMonth(clinicPayments, today, currentMonth)}
      maxMonth={currentMonth}
      value={overdueInMonth(clinicPayments, month, today)}
      previous={overdueInMonth(clinicPayments, addMonths(month, -1), today)}
      onMonth={setMonth}
    />
  );
}

function ReceivedWidget() {
  const clinicPayments = useClinicPayments();
  const currentMonth = todayISO().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  return (
    <MonthTotalCard
      title="Total recebido"
      month={month}
      minMonth={earliestReceivedMonth(clinicPayments, currentMonth)}
      maxMonth={currentMonth}
      value={receivedInMonth(clinicPayments, month)}
      previous={receivedInMonth(clinicPayments, addMonths(month, -1))}
      onMonth={setMonth}
    />
  );
}

function ActivePatientsWidget() {
  const { patients } = useClinic();
  const activeCount = patients.filter((patient) => patient.status === "ativo").length;
  return (
    <Card>
      <p className="text-sm text-muted">Pacientes ativos</p>
      <p className="font-num text-5xl font-semibold text-teal">{activeCount}</p>
    </Card>
  );
}

function FutureCountWidget() {
  const clinicPayments = useClinicPayments();
  return (
    <Card>
      <p className="text-sm text-muted">Lançamentos futuros</p>
      <p className="font-num text-5xl font-semibold text-teal">{clinicPayments.filter((payment) => isFutureLaunch(payment)).length}</p>
    </Card>
  );
}

function DebtorsCountWidget() {
  const debtors = useDebtors();
  return (
    <Card>
      <p className="text-sm text-muted">Pacientes em Atraso</p>
      <p className="font-num text-5xl font-semibold text-accent">{debtors.length}</p>
    </Card>
  );
}

function CalendarWidget() {
  const { user } = useAuth();
  const { patients, appointments, members, locations, patientName, memberName, locationName } = useClinic();
  const today = todayISO();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const [placeId, setPlaceId] = useState("");
  const currentMember = members.find((member) => member.uid === user?.uid || member.email === user?.email?.toLowerCase());
  const workplaces = memberWorkplaces(locations, currentMember, user?.uid);
  const activeLocationId = placeId || workplaces[0]?.id || "";
  const activeLocationName = activeLocationId ? locationName(activeLocationId) : "";
  const professionalName = currentMember?.nome || "seu cadastro";
  const scopedAppointments = useMemo(() => {
    return appointments.filter((item) => {
      if (item.status === "cancelado") return false;
      if (!activeLocationId) return true;
      return item.locationId === activeLocationId;
    });
  }, [activeLocationId, appointments]);
  const marks = useMemo(() => {
    return scopedAppointments.reduce<Record<string, number>>((acc, item) => {
      acc[item.date] = (acc[item.date] || 0) + 1;
      return acc;
    }, {});
  }, [scopedAppointments]);
  const dayItems = scopedAppointments
    .filter((item) => item.date === selected)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const namedPatient = (id: string) => (patients.some((patient) => patient.id === id) ? patientName(id) : "Ocupado");
  const namedMember = (id: string | null) => {
    if (!id) return "Sem profissional";
    return members.some((member) => member.id === id) ? memberName(id) : "Outro profissional";
  };

  return (
    <Card>
      <div className="mb-4">
        {workplaces.length > 1 ? (
          <Select
            value={activeLocationId}
            onChange={setPlaceId}
            options={workplaces.map((item) => ({ value: item.id, label: item.nome }))}
          />
        ) : (
          <p className="text-sm font-medium text-ink">
            {activeLocationName ? `Local em validação: ${activeLocationName}` : "Atendimentos de todos os locais que você acessa"}
          </p>
        )}
        <p className="mt-2 text-sm text-muted">
          {activeLocationName
            ? `Estas marcações são do local ${activeLocationName}, de qualquer profissional. A grade livre é a de ${professionalName}.`
            : "Cada atendimento indica o próprio local. Não há um consultório único nesta lista."}
        </p>
      </div>
      <MonthCalendar
        month={month}
        selected={selected}
        marks={marks}
        onMonth={setMonth}
        onSelect={setSelected}
      />
      <div className="mt-6 border-t border-[#e7eee8] pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-medium text-teal">{formatDate(selected)}</h2>
            <p className="text-sm text-muted">
              {activeLocationName ? `Agenda de ${activeLocationName}` : "Todos os locais"}
            </p>
          </div>
          <Link
            className="btn-text"
            href={activeLocationId ? `/admin/agenda?date=${selected}&location=${activeLocationId}` : `/admin/agenda?date=${selected}`}
          >
            Abrir na agenda
          </Link>
        </div>
        {dayItems.length === 0 ? (
          <Empty>{activeLocationName ? `Nenhum atendimento em ${activeLocationName} neste dia.` : "Nenhum atendimento neste dia."}</Empty>
        ) : (
          <>
            <div className="admin-mobile-only min-w-0">
              {dayItems.map((item) => (
                <StackedRow
                  key={item.id}
                  primary={
                    <Link href={`/admin/atendimentos/${item.id}`} className="text-teal">
                      {namedPatient(item.patientId)}
                    </Link>
                  }
                  secondary={`${item.startTime}–${item.endTime} · ${namedMember(item.professionalId)} · ${labelAppointmentPlace(item.modality, item.locationId ? locationName(item.locationId) : "")}`}
                  meta={<Pill tone="sage">{labelAppointmentStatus(item.status)}</Pill>}
                />
              ))}
            </div>
            <ResponsiveTableWrap>
              <DataTable minWidth={640}>
                <thead>
                  <tr>
                    <Th>Horário</Th>
                    <Th>Paciente</Th>
                    <Th>Profissional</Th>
                    <Th>Local</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {dayItems.map((item) => (
                    <tr key={item.id} className="hover:bg-paper">
                      <Td>
                        {item.startTime}–{item.endTime}
                      </Td>
                      <Td>
                        <Link href={`/admin/atendimentos/${item.id}`} className="font-medium text-teal">
                          {namedPatient(item.patientId)}
                        </Link>
                      </Td>
                      <Td>{namedMember(item.professionalId)}</Td>
                      <Td>{labelAppointmentPlace(item.modality, item.locationId ? locationName(item.locationId) : "")}</Td>
                      <Td>
                        <Pill tone="sage">{labelAppointmentStatus(item.status)}</Pill>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </ResponsiveTableWrap>
          </>
        )}
      </div>
    </Card>
  );
}

function FutureListWidget() {
  const { patientName } = useClinic();
  const clinicPayments = useClinicPayments();
  const future = clinicPayments.filter((payment) => isFutureLaunch(payment)).slice(0, 6);
  return (
    <Card>
      <WidgetSectionTitle title="Lançamentos futuros" />
      {future.length === 0 ? (
        <Empty>Nenhum pagamento agendado.</Empty>
      ) : (
        <>
          <MobileListGrid>
            {future.map((payment) => (
              <ListCard
                key={payment.id}
                href="/admin/financeiro"
                title={patientName(payment.patientId)}
                subtitle={`${formatDate(payment.dueDate)} · ${payment.descricao}`}
                trailing={<span className="font-num text-sm font-semibold text-ink">{formatMoney(remainingAmount(payment))}</span>}
              />
            ))}
          </MobileListGrid>
          <ResponsiveTableWrap>
            <DataTable minWidth={480}>
              <thead>
                <tr>
                  <Th>Paciente</Th>
                  <Th>Descrição</Th>
                  <Th>Valor</Th>
                </tr>
              </thead>
              <tbody>
                {future.map((payment) => (
                  <tr key={payment.id}>
                    <Td>
                      <p className="font-medium">{patientName(payment.patientId)}</p>
                      <p className="text-xs text-muted">{formatDate(payment.dueDate)}</p>
                    </Td>
                    <Td>{payment.descricao}</Td>
                    <Td className="font-semibold">{formatMoney(remainingAmount(payment))}</Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </ResponsiveTableWrap>
        </>
      )}
      <WidgetSectionFooter>
        <Link href="/admin/financeiro" className="btn-text min-h-11">
          Ver financeiro
        </Link>
      </WidgetSectionFooter>
    </Card>
  );
}

function DebtorsListWidget() {
  const debtors = useDebtors();
  return (
    <Card>
      <WidgetSectionTitle title="Não pagaram" />
      {debtors.length === 0 ? (
        <Empty>Nenhum paciente inadimplente.</Empty>
      ) : (
        <>
          <MobileListGrid>
            {debtors.map((patient) => (
              <ListCard key={patient.id} href={`/admin/pacientes/${patient.id}`} title={patient.nome} subtitle="Pagamento em aberto" />
            ))}
          </MobileListGrid>
          <ResponsiveTableWrap>
            <DataTable minWidth={280}>
              <thead>
                <tr>
                  <Th>Paciente</Th>
                </tr>
              </thead>
              <tbody>
                {debtors.map((patient) => (
                  <tr key={patient.id} className="hover:bg-paper">
                    <Td>
                      <Link href={`/admin/pacientes/${patient.id}`} className="font-medium text-teal">
                        {patient.nome}
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </ResponsiveTableWrap>
        </>
      )}
      <WidgetSectionFooter>
        <Link href="/admin/financeiro?view=aberto" className="btn-text min-h-11">
          Ver financeiro
        </Link>
      </WidgetSectionFooter>
    </Card>
  );
}

/** Component that renders each dashboard widget. Every widget owns its own state. */
export const DASHBOARD_WIDGET_COMPONENTS: Record<WidgetId, ComponentType> = {
  receivable: ReceivableWidget,
  overdue: OverdueWidget,
  received: ReceivedWidget,
  activePatients: ActivePatientsWidget,
  futureCount: FutureCountWidget,
  debtorsCount: DebtorsCountWidget,
  calendar: CalendarWidget,
  futureList: FutureListWidget,
  debtorsList: DebtorsListWidget,
};