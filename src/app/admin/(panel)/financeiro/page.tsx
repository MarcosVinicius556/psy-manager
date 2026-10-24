"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import MonthTotalCard from "@/components/admin/MonthTotalCard";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DateField from "@/components/admin/DateField";
import Drawer from "@/components/admin/Drawer";
import Select from "@/components/admin/Select";
import PaymentForm from "@/components/admin/PaymentForm";
import ReceivePayment from "@/components/admin/ReceivePayment";
import { ReceiptLinks } from "@/components/admin/FileAttachments";
import SetupNeeded from "@/components/admin/SetupNeeded";
import FinanceFilterSheet from "@/components/admin/mobile/FinanceFilterSheet";
import FloatingActionButton from "@/components/admin/mobile/FloatingActionButton";
import ListCard from "@/components/admin/mobile/ListCard";
import SegmentedControl from "@/components/admin/mobile/SegmentedControl";
import StackedRow from "@/components/admin/mobile/StackedRow";
import { ListSkeleton } from "@/components/admin/mobile/Skeleton";
import { Card, DataTable, Empty, MobileListGrid, PageTitle, Pill, ResponsiveTableWrap, Td, Th } from "@/components/admin/ui";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import { memberWorkplaces } from "@/lib/admin/workplaces";
import {
  agreedAmount,
  isUnpaid,
  overdueInMonth,
  patientsInGoodStanding,
  paymentReceipts,
  receivableInMonth,
  receivedExternalInMonth,
  receivedFromPatientsInMonth,
  receivedInMonth,
  receivedAmount,
  remainingAmount,
  unpaidPatients,
} from "@/lib/admin/finance";
import { addMonths, formatDate, formatMoney, labelPaymentMethod, labelPaymentStatus, todayISO } from "@/lib/admin/format";
import { maskPhone } from "@/lib/masks";
import type { Payment, PaymentStatus } from "@/lib/admin/types";

function FinanceContent() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { patients, payments, members, locations, loading, patientName } = useClinic();
  const currentMember = members.find((member) => member.uid === user?.uid || member.email === user?.email?.toLowerCase());
  const presetPatientId = params.get("patientId") || "";
  const drawerOpen = params.get("novo") === "1" || Boolean(presetPatientId);
  const [status, setStatus] = useState<"todos" | PaymentStatus>("todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [view, setView] = useState<"lancamentos" | "emdia" | "aberto">("lancamentos");

  useEffect(() => {
    const preset = params.get("view");
    if (preset === "aberto" || preset === "emdia" || preset === "lancamentos") setView(preset);
  }, [params]);
  const [receiving, setReceiving] = useState<Payment | null>(null);
  const today = todayISO();
  const currentMonth = today.slice(0, 7);
  const [month, setMonth] = useState(currentMonth);

  const filtered = useMemo(() => {
    return payments.filter((payment) => {
      if (status !== "todos" && payment.status !== status) return false;
      if (!payment.dueDate.startsWith(month)) return false;
      if (from && payment.dueDate < from) return false;
      if (to && payment.dueDate > to) return false;
      return true;
    });
  }, [from, month, payments, status, to]);

  const debtors = unpaidPatients(patients, payments);
  const good = patientsInGoodStanding(patients, payments);

  function closeDrawer() {
    const next = new URLSearchParams(params.toString());
    next.delete("novo");
    next.delete("patientId");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  if (loading) return <ListSkeleton rows={4} />;

  const missingPatient = patients.length === 0;
  const missingLocation = memberWorkplaces(locations, currentMember, user?.uid).length === 0;
  if (missingPatient || missingLocation) {
    return <SetupNeeded title="Contas a receber" missingPatient={missingPatient} missingLocation={missingLocation} />;
  }

  return (
    <div className="admin-fab-pad">
      <PageTitle
        title="Contas a receber"
        subtitle="Pagamentos previstos, recebidos e em aberto."
        action={
          <button
            type="button"
            className="btn-primary"
            onClick={() => router.replace(`${pathname}?novo=1`, { scroll: false })}
          >
            Novo lançamento
          </button>
        }
      />
      <FloatingActionButton label="Novo lançamento" onClick={() => router.replace(`${pathname}?novo=1`, { scroll: false })} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MonthTotalCard
          title="Total recebido"
          month={month}
          value={receivedInMonth(payments, month)}
          previous={receivedInMonth(payments, addMonths(month, -1))}
          footnote={`Pacientes ${formatMoney(receivedFromPatientsInMonth(payments, month))} · Renda externa ${formatMoney(receivedExternalInMonth(payments, month))}`}
        />
        <MonthTotalCard
          title="A receber no mês"
          month={month}
          value={receivableInMonth(payments, month)}
          previous={receivableInMonth(payments, addMonths(month, -1))}
          footnote={month === currentMonth ? "O que ainda falta receber neste mês vigente." : "Lançamentos em aberto com vencimento neste mês."}
        />
        <MonthTotalCard
          title="Em atraso"
          month={month}
          value={overdueInMonth(payments, month, today)}
          previous={overdueInMonth(payments, addMonths(month, -1), today)}
          invertTone
          footnote="Em haver com vencimento antes de hoje."
        />
      </div>
      <div className="mb-4">
        <SegmentedControl
          ariaLabel="Visão do financeiro"
          layout="equal"
          value={view}
          onChange={setView}
          options={[
            { value: "lancamentos", label: "Lançamentos" },
            { value: "emdia", label: "Em dia" },
            { value: "aberto", label: "Pendentes" },
          ]}
        />
      </div>

      {view === "lancamentos" && (
        <Card>
          <FinanceFilterSheet
            status={status}
            month={month}
            from={from}
            to={to}
            onStatus={setStatus}
            onMonth={setMonth}
            onFrom={setFrom}
            onTo={setTo}
          />
          <div className="admin-desktop-only admin-desktop-grid mb-4 grid-cols-4 gap-3">
            <Select
              value={status}
              onChange={(next) => setStatus(next as typeof status)}
              options={[
                { value: "todos", label: "Todos os status" },
                { value: "agendado", label: "Agendado" },
                { value: "em_haver", label: "Em haver" },
                { value: "pago", label: "Pago" },
                { value: "nao_pago", label: "Não pago" },
              ]}
            />
            <DateField mode="month" value={month} onChange={setMonth} />
            <DateField value={from} onChange={setFrom} />
            <DateField value={to} min={from} onChange={setTo} />
          </div>
          {filtered.length === 0 ? (
            <Empty>Nenhum lançamento neste filtro.</Empty>
          ) : (
            <>
            <div className="admin-mobile-only min-w-0" data-mobile-list>
              {filtered.map((payment) => {
                const remaining = remainingAmount(payment);
                const received = receivedAmount(payment);
                const canReceive = remaining > 0 && payment.status !== "nao_pago";
                return (
                  <StackedRow
                    key={payment.id}
                    primary={
                      payment.origem === "externo" ? (
                        payment.descricao
                      ) : (
                        <Link href={`/admin/pacientes/${payment.patientId}`} className="text-teal">
                          {patientName(payment.patientId)}
                        </Link>
                      )
                    }
                    amount={formatMoney(agreedAmount(payment))}
                    secondary={`Vence ${formatDate(payment.dueDate)} · ${payment.descricao}`}
                    status={
                      <Pill tone={payment.status === "pago" ? "teal" : isUnpaid(payment) ? "accent" : "sage"}>
                        {labelPaymentStatus(payment.status)}
                      </Pill>
                    }
                    hint={
                      remaining > 0 ? (
                        <>
                          Faltam {formatMoney(remaining)}
                          {received > 0 ? ` · recebido ${formatMoney(received)}` : ""}
                        </>
                      ) : null
                    }
                    actions={
                      <button
                        type="button"
                        className={`admin-action-btn ${canReceive ? "btn-row" : "btn-text"}`}
                        onClick={() => setReceiving(payment)}
                      >
                        {canReceive ? "Receber" : "Histórico"}
                      </button>
                    }
                  />
                );
              })}
            </div>
            <ResponsiveTableWrap>
            <DataTable minWidth={920}>
              <thead>
                <tr>
                  <Th>Paciente</Th>
                  <Th>Descrição</Th>
                  <Th>Vencimento</Th>
                  <Th>Forma</Th>
                  <Th>Acordado</Th>
                  <Th>Faltante</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Ações</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((payment) => {
                  const remaining = remainingAmount(payment);
                  const received = receivedAmount(payment);
                  const canReceive = remaining > 0 && payment.status !== "nao_pago";
                  return (
                    <tr key={payment.id} className="hover:bg-paper">
                      <Td>
                        {payment.origem === "externo" ? (
                          <span className="text-ink">Sem paciente</span>
                        ) : (
                          <Link href={`/admin/pacientes/${payment.patientId}`} className="font-medium text-teal">
                            {patientName(payment.patientId)}
                          </Link>
                        )}
                      </Td>
                      <Td>
                        <span>{payment.descricao}</span>
                        {payment.origem === "externo" && (
                          <span className="mt-1 block">
                            <Pill tone="muted">Renda externa</Pill>
                          </span>
                        )}
                      </Td>
                      <Td>{formatDate(payment.dueDate)}</Td>
                      <Td>{labelPaymentMethod(payment.formaPagamento)}</Td>
                      <Td className="font-semibold">{formatMoney(agreedAmount(payment))}</Td>
                      <Td>
                        {formatMoney(remaining)}
                        {received > 0 && remaining > 0 ? <span className="mt-0.5 block text-xs text-muted">Recebido {formatMoney(received)}</span> : null}
                      </Td>
                      <Td>
                        <Pill tone={payment.status === "pago" ? "teal" : isUnpaid(payment) ? "accent" : "sage"}>
                          {labelPaymentStatus(payment.status)}
                        </Pill>
                      </Td>
                      <Td className="text-right">
                        <div className="flex flex-col items-end gap-2">
                          <button type="button" className={canReceive ? "btn-row" : "btn-text"} onClick={() => setReceiving(payment)}>
                            {canReceive ? "Receber" : "Histórico"}
                          </button>
                          <ReceiptLinks files={paymentReceipts(payment)} />
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
            </ResponsiveTableWrap>
            </>
          )}
        </Card>
      )}

      {view === "emdia" && (
        <Card>
          {good.length === 0 ? <Empty>Nenhum paciente com pagamentos em dia.</Empty> : (
            <>
            <MobileListGrid>
              {good.map((patient) => (
                <ListCard
                  key={patient.id}
                  href={`/admin/pacientes/${patient.id}`}
                  title={patient.nome}
                  subtitle={maskPhone(patient.telefone) || "—"}
                />
              ))}
            </MobileListGrid>
            <ResponsiveTableWrap>
            <DataTable>
              <thead>
                <tr>
                  <Th>Paciente</Th>
                  <Th>Telefone</Th>
                </tr>
              </thead>
              <tbody>
                {good.map((patient) => (
                  <tr key={patient.id} className="hover:bg-paper">
                    <Td>
                      <Link href={`/admin/pacientes/${patient.id}`} className="font-medium text-teal">{patient.nome}</Link>
                    </Td>
                    <Td>{maskPhone(patient.telefone) || "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            </ResponsiveTableWrap>
            </>
          )}
        </Card>
      )}

      {view === "aberto" && (
        <Card>
          {debtors.length === 0 ? <Empty>Nenhum paciente com pagamento em aberto.</Empty> : (
            <>
            <MobileListGrid>
              {debtors.map((patient) => (
                <ListCard
                  key={patient.id}
                  href={`/admin/pacientes/${patient.id}`}
                  title={patient.nome}
                  subtitle={maskPhone(patient.telefone) || "—"}
                />
              ))}
            </MobileListGrid>
            <ResponsiveTableWrap>
            <DataTable>
              <thead>
                <tr>
                  <Th>Paciente</Th>
                  <Th>Telefone</Th>
                </tr>
              </thead>
              <tbody>
                {debtors.map((patient) => (
                  <tr key={patient.id} className="hover:bg-paper">
                    <Td>
                      <Link href={`/admin/pacientes/${patient.id}`} className="font-medium text-teal">{patient.nome}</Link>
                    </Td>
                    <Td>{maskPhone(patient.telefone) || "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            </ResponsiveTableWrap>
            </>
          )}
        </Card>
      )}
      {receiving && <ReceivePayment payment={receiving} onClose={() => setReceiving(null)} />}
      <Drawer open={drawerOpen} title="Novo lançamento" onClose={closeDrawer}>
        {drawerOpen && (
          <PaymentForm key={presetPatientId || "novo"} patientId={presetPatientId} onSaved={closeDrawer} />
        )}
      </Drawer>
    </div>
  );
}

export default function FinancePage() {
  return (
    <Suspense fallback={<p className="text-muted">Carregando contas a receber...</p>}>
      <FinanceContent />
    </Suspense>
  );
}
