"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import DateField from "@/components/admin/DateField";
import Drawer from "@/components/admin/Drawer";
import Select from "@/components/admin/Select";
import { Card, DataTable, Empty, Field, PageTitle, Pill, Td, Th, fieldClass } from "@/components/admin/ui";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import { locationSharePeople, memberWorkplaces, shareKeyForLocation, sharePersonName, userBelongsToLocation } from "@/lib/admin/workplaces";
import MonthTotalCard from "@/components/admin/MonthTotalCard";
import {
  canSettleExpense,
  dueLabel,
  expenseInMonth,
  expenseSummaryInMonth,
  expenseTypeLabel,
  installmentDates,
  installmentValue,
  intervalLabel,
  isDueSoon,
  isExpenseOverdue,
  isSharedExpense,
  MAX_PAST_RECURRENCES,
  paidShareCount,
  recurringDatesBefore,
} from "@/lib/admin/expenses";
import { addMonths, formatDate, formatMoney, monthLabel, parseMoney, todayISO } from "@/lib/admin/format";
import { splitEvenly } from "@/lib/admin/schedule";
import type { ClinicMember, Expense, ExpenseType, InstallmentInterval } from "@/lib/admin/types";

function openingShareState(expense: Expense | undefined, people: { id: string }[], members: ClinicMember[]) {
  const rows = expense?.shares ?? [];
  if (people.length > 1) {
    return Object.fromEntries(
      rows.flatMap((share) => {
        const key = shareKeyForLocation(share.memberId, people, members);
        return key ? [[key, String(share.valor)] as const] : [];
      })
    );
  }
  return Object.fromEntries(rows.map((share) => [share.memberId, String(share.valor)]));
}

function openingAmount(expense?: Expense) {
  if (!expense) return "";
  if (expense.tipo === "parcelada" && expense.parcelas > 1) {
    return String(Math.round(expense.valor * expense.parcelas * 100) / 100);
  }
  return String(expense.valor);
}

function dateList(dates: string[]) {
  if (dates.length > 4) return `${formatDate(dates[0])} a ${formatDate(dates[dates.length - 1])}`;
  const labels = dates.map((date) => formatDate(date));
  if (labels.length <= 1) return labels[0] || "";
  return `${labels.slice(0, -1).join(", ")} e ${labels[labels.length - 1]}`;
}

function shareAlreadyPaid(expense: Expense | undefined, memberId: string, members: ClinicMember[]) {
  if (!expense?.shares.length) return false;
  return expense.shares.some((share) => {
    if (!share.paga) return false;
    if (share.memberId === memberId) return true;
    const person = members.find((member) => member.id === share.memberId || member.uid === share.memberId);
    return Boolean(person && (person.uid === memberId || person.id === memberId));
  });
}

function ExpenseForm({
  expense,
  lockedLocationId,
  onSaved,
}: {
  expense?: Expense;
  lockedLocationId?: string;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const { members, locations, locationInvites, saveExpense } = useClinic();
  const paidInstallments = expense?.tipo === "parcelada" ? Math.max(0, expense.parcelas - expense.parcelasRestantes) : 0;
  const mine = members.find((member) => member.uid === user?.uid);
  const workplaces = memberWorkplaces(locations, mine, user?.uid);
  const activeMembers = members.filter((member) => member.ativo || expense?.shares.some((share) => share.memberId === member.id || share.memberId === member.uid));
  const openingId = expense?.locationId || lockedLocationId || "";
  const openingPlace = locations.find((place) => place.id === openingId);
  const openingPeople = openingPlace ? locationSharePeople(openingPlace, members, locationInvites) : [];
  const [placeId, setPlaceId] = useState(openingId);
  const [descricao, setDescricao] = useState(expense?.descricao ?? "");
  const [tipo, setTipo] = useState<ExpenseType>(expense?.tipo ?? "fixo");
  const [valor, setValor] = useState(openingAmount(expense));
  const [competencia, setCompetencia] = useState(expense?.competencia ?? todayISO().slice(0, 7));
  const [vencimento, setVencimento] = useState(expense?.vencimento ?? "");
  const [inicio, setInicio] = useState(expense?.inicio || expense?.vencimento || todayISO());
  const [parcelas, setParcelas] = useState(expense?.parcelas ? String(expense.parcelas) : "2");
  const [intervalo, setIntervalo] = useState<InstallmentInterval>(expense?.intervalo || "mensal");
  const [repetir, setRepetir] = useState(expense?.tipo === "fixo" && Boolean(expense.intervalo));
  const [jaPaga, setJaPaga] = useState(Boolean(expense?.paga));
  const [observacoes, setObservacoes] = useState(expense?.observacoes ?? "");
  const quantidade = Math.max(0, Math.floor(Number(parcelas) || 0));
  const schedule = tipo === "parcelada" && inicio && quantidade > 0 ? installmentDates(inicio, quantidade, intervalo) : [];
  const [shares, setShares] = useState<Record<string, string>>(
    openingShareState(expense, openingPeople.length > 1 ? openingPeople : [], members)
  );
  const [saving, setSaving] = useState(false);
  const [pastPrompt, setPastPrompt] = useState<{ message: string; plural: boolean } | null>(null);
  const partners = useMemo(() => {
    const place = locations.find((item) => item.id === placeId);
    if (!place) return [];
    const people = locationSharePeople(place, members, locationInvites);
    return people.length > 1 ? people : [];
  }, [locationInvites, locations, members, placeId]);
  const splittingWithPartners = partners.length > 1;
  const splitPeople = splittingWithPartners ? partners : activeMembers.map((member) => ({ id: member.id, nome: member.nome }));
  const partnerKey = partners.map((person) => person.id).join("|");
  const seenPartners = useRef(partnerKey);
  useEffect(() => {
    if (seenPartners.current === partnerKey) return;
    seenPartners.current = partnerKey;
    setShares((current) => {
      if (!splittingWithPartners) return {};
      const next: Record<string, string> = {};
      for (const [key, value] of Object.entries(current)) {
        const mapped = shareKeyForLocation(key, partners, members);
        if (mapped) next[mapped] = value;
      }
      return next;
    });
  }, [members, partnerKey, partners, splittingWithPartners]);
  const contractTotal = parseMoney(valor);
  const splitTarget = tipo === "parcelada" ? installmentValue(contractTotal, quantidade) : contractTotal;
  const selectedIds = Object.keys(shares);
  const allocated = selectedIds.reduce((sum, id) => sum + parseMoney(shares[id]), 0);
  useEffect(() => {
    setPastPrompt(null);
  }, [tipo, vencimento, inicio, parcelas, intervalo, repetir, valor]);

  function toggleMember(id: string) {
    setShares((current) => {
      if (id in current) {
        const next = { ...current };
        delete next[id];
        return next;
      }
      return { ...current, [id]: "0" };
    });
  }

  function divideEvenly() {
    const ids = Object.keys(shares);
    if (!ids.length || splitTarget <= 0) return;
    const parts = splitEvenly(splitTarget, ids.length);
    setShares(Object.fromEntries(ids.map((id, index) => [id, parts[index].toFixed(2)])));
  }

  function pastDueDates(today: string) {
    if (tipo === "parcelada") return schedule.filter((date) => date < today);
    if (!vencimento || vencimento >= today) return [];
    if (!expense && tipo === "fixo" && repetir && intervalo) return recurringDatesBefore(vencimento, intervalo, today);
    return [vencimento];
  }

  function pastDueMessage(dates: string[]) {
    const listed = dateList(dates);
    if (tipo === "parcelada") {
      const future = schedule.length - dates.length;
      const lead =
        dates.length === 1
          ? `Você está lançando uma parcela com vencimento anterior a hoje (${listed}). Ela já foi paga?`
          : `Você está lançando ${dates.length} parcelas com vencimento anterior a hoje (${listed}). Elas já foram pagas?`;
      return future > 0 ? `${lead} As parcelas futuras ficam em aberto.` : lead;
    }
    if (dates.length === 1) {
      return `Você está lançando um vencimento anterior a hoje (${listed}). Esta conta já foi paga?`;
    }
    return `Você está lançando ${dates.length} vencimentos anteriores a hoje (${listed}). Essas contas já foram pagas? Os próximos vencimentos ficam em aberto.`;
  }

  async function persist(pastPaid: boolean | null) {
    setPastPrompt(null);
    setSaving(true);
    try {
      const today = todayISO();
      const pastDates = pastDueDates(today);
      const paidCount = tipo === "parcelada" && pastPaid ? Math.max(paidInstallments, pastDates.length) : paidInstallments;
      const markPaid = pastPaid !== null ? pastPaid : jaPaga;
      const shareRows = (selectedIds.length
        ? selectedIds.map((memberId) => ({
            memberId,
            valor: parseMoney(shares[memberId]),
          }))
        : mine
          ? [{ memberId: mine.id, valor: splitTarget }]
          : []
      ).map((share) => ({
        ...share,
        paga:
          tipo === "parcelada"
            ? false
            : pastPaid !== null
              ? pastPaid
              : jaPaga || (!expense?.paga && shareAlreadyPaid(expense, share.memberId, members)),
      }));
      const markedPaid =
        tipo !== "parcelada" && (pastPaid !== null ? pastPaid : markPaid || (shareRows.length > 0 && shareRows.every((share) => share.paga)));
      await saveExpense(
        {
          descricao,
          tipo,
          valor: splitTarget,
          competencia: tipo === "parcelada" ? inicio.slice(0, 7) : vencimento ? vencimento.slice(0, 7) : competencia,
          vencimento: tipo === "parcelada" ? schedule[0] || inicio : vencimento,
          paga: markedPaid,
          inicio: tipo === "parcelada" ? inicio : "",
          parcelas: tipo === "parcelada" ? quantidade : 0,
          parcelasRestantes: tipo === "parcelada" ? Math.max(0, quantidade - paidCount) : 0,
          intervalo: tipo === "parcelada" ? intervalo : tipo === "fixo" && repetir ? intervalo : "",
          serieId: expense?.serieId || "",
          observacoes,
          locationId: placeId || null,
          shares: shareRows,
        },
        expense?.id
      );
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a despesa.");
    } finally {
      setSaving(false);
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const today = todayISO();
    const dates = pastDueDates(today);
    const needsAnswer = tipo === "parcelada" ? dates.length > paidInstallments : dates.length > 0;
    if (!expense && tipo === "fixo" && repetir && dates.length > MAX_PAST_RECURRENCES) {
      toast.error("Há mais de 36 vencimentos anteriores a hoje. Escolha uma data inicial mais recente.");
      return;
    }
    if (needsAnswer) {
      setPastPrompt({ message: pastDueMessage(dates), plural: dates.length > 1 });
      return;
    }
    void persist(null);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Field label="Descrição">
        <input className={fieldClass} value={descricao} onChange={(event) => setDescricao(event.target.value)} placeholder="Aluguel, supervisão, material" required />
      </Field>
      <Field label="Local">
        {lockedLocationId ? (
          <input className={fieldClass} value={workplaces.find((place) => place.id === lockedLocationId)?.nome || locations.find((place) => place.id === lockedLocationId)?.nome || "Este local"} disabled />
        ) : (
          <Select
            value={placeId}
            onChange={setPlaceId}
            options={[{ value: "", label: "Sem local" }, ...workplaces.map((place) => ({ value: place.id, label: place.nome }))]}
          />
        )}
      </Field>
      <Field label="Tipo">
        <Select
          value={tipo}
          onChange={(next) => {
            const value = next as ExpenseType;
            setTipo(value);
            if (value === "variavel") setRepetir(false);
          }}
          options={[
            { value: "fixo", label: "Fixa" },
            { value: "variavel", label: "Variável" },
            { value: "parcelada", label: "Parcelada" },
          ]}
        />
      </Field>
      <Field label="Valor total">
        <input className={fieldClass} inputMode="decimal" value={valor} onChange={(event) => setValor(event.target.value)} required />
      </Field>
      {tipo === "parcelada" ? (
        <>
          <Field label="Quantidade de parcelas">
            <input className={fieldClass} inputMode="numeric" min={1} value={parcelas} onChange={(event) => setParcelas(event.target.value)} required />
          </Field>
          {tipo === "parcelada" && quantidade > 1 && contractTotal > 0 && (
            <p className="text-sm text-muted">Cada parcela: {formatMoney(splitTarget)}.</p>
          )}
          <Field label="Primeira parcela">
            <DateField value={inicio} onChange={setInicio} required />
          </Field>
          <Field label="Intervalo">
            <Select
              value={intervalo}
              onChange={(next) => setIntervalo(next as InstallmentInterval)}
              options={[
                { value: "semanal", label: "Semanal" },
                { value: "mensal", label: "Mensal" },
                { value: "anual", label: "Anual" },
              ]}
            />
          </Field>
          {schedule.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">
                Parcelas de {formatDate(schedule[0])} até {formatDate(schedule[schedule.length - 1])}
                {splitTarget > 0 ? ` · ${formatMoney(splitTarget)} cada` : ""}
              </p>
              <DataTable minWidth={420}>
                <thead>
                  <tr>
                    <Th>Parcela</Th>
                    <Th>Vencimento</Th>
                    <Th>Situação</Th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((date, index) => (
                    <tr key={date}>
                      <Td>{index + 1}</Td>
                      <Td>{formatDate(date)}</Td>
                      <Td>{index < paidInstallments ? "Paga" : index === paidInstallments ? "Próxima" : "A vencer"}</Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </div>
          )}
        </>
      ) : (
        <>
          <Field label="Competência">
            <DateField mode="month" value={competencia} onChange={setCompetencia} required />
          </Field>
          <Field label="Vencimento">
            <DateField
              value={vencimento}
              onChange={(next) => {
                setVencimento(next);
                if (next.length >= 7) setCompetencia(next.slice(0, 7));
              }}
            />
          </Field>
          {tipo === "fixo" && (
            <div>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" className="mt-0.5" checked={repetir} onChange={(event) => setRepetir(event.target.checked)} />
                <span>
                  <strong className="font-medium">Repetir automaticamente</strong>
                  <span className="mt-1 block text-muted">
                    No início de cada período, esta despesa é gerada de novo, com o mesmo valor e o vencimento no mesmo dia.
                  </span>
                </span>
              </label>
              {repetir && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(
                    [
                      ["semanal", "Semanal"],
                      ["mensal", "Mensal"],
                      ["anual", "Anual"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setIntervalo(value)}
                      className={intervalo === value ? "btn-chip-active" : "btn-chip"}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <label className="flex items-center gap-3 text-sm font-medium">
            <input type="checkbox" checked={jaPaga} onChange={(event) => setJaPaga(event.target.checked)} />
            Já está paga
          </label>
        </>
      )}
      <Field label="Observações">
        <textarea className={`${fieldClass} min-h-20`} value={observacoes} onChange={(event) => setObservacoes(event.target.value)} />
      </Field>
      {splitPeople.length > 1 ? (
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-medium">Dividir o valor</span>
          <button type="button" className="btn-text" onClick={divideEvenly}>Dividir igualmente</button>
        </div>
        {tipo === "parcelada" ? (
          <p className="mb-2 text-sm text-muted">
            {`O rateio é de uma parcela (${formatMoney(splitTarget)})${splittingWithPartners ? " e fica entre quem já compartilha este local." : "."}`}
          </p>
        ) : splittingWithPartners ? (
          <p className="mb-2 text-sm text-muted">O rateio fica entre quem já compartilha este local.</p>
        ) : null}
        <div className="grid gap-2">
          {splitPeople.map((person) => {
            const checked = person.id in shares;
            return (
              <label key={person.id} className="grid grid-cols-[auto_1fr_120px] items-center gap-3 rounded-md bg-paper px-4 py-3">
                <input type="checkbox" checked={checked} onChange={() => toggleMember(person.id)} />
                <span>{person.nome}</span>
                <input
                  className={fieldClass}
                  inputMode="decimal"
                  disabled={!checked}
                  value={checked ? shares[person.id] : ""}
                  onChange={(event) => setShares({ ...shares, [person.id]: event.target.value })}
                  placeholder="0,00"
                />
              </label>
            );
          })}
        </div>
        <p className={`mt-2 text-sm ${selectedIds.length === 0 || Math.abs(allocated - splitTarget) < 0.001 ? "text-teal" : "text-accent"}`}>
          {selectedIds.length === 0 ? "Sem divisão: o valor fica com você." : `Rateado ${formatMoney(allocated)} de ${formatMoney(splitTarget)}`}
        </p>
      </div>
      ) : placeId ? (
        <p className="text-sm text-muted">Compartilhe este local com outro profissional para dividir a despesa entre vocês.</p>
      ) : null}
      {pastPrompt ? (
        <div className="rounded-md bg-paper px-4 py-4">
          <p className="text-sm">{pastPrompt.message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" disabled={saving} onClick={() => persist(true)}>
              {saving ? "Salvando..." : pastPrompt.plural ? "Sim, já foram pagas" : "Sim, já foi paga"}
            </button>
            <button type="button" className="btn-row" disabled={saving} onClick={() => persist(false)}>
              {pastPrompt.plural ? "Não, continuam em aberto" : "Não, continua em aberto"}
            </button>
          </div>
        </div>
      ) : (
        <button className="btn-primary" disabled={saving}>
          {saving ? "Salvando..." : "Salvar despesa"}
        </button>
      )}
    </form>
  );
}

export default function RoomExpenses({ locationId }: { locationId?: string }) {
  const { user } = useAuth();
  const { members, locations, locationInvites, expenses, loading, locationName, deleteExpense, payExpense } = useClinic();
  const currentMonth = todayISO().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [tipo, setTipo] = useState<"todos" | Expense["tipo"]>("todos");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [creating, setCreating] = useState(false);
  const mine = members.find((member) => member.uid === user?.uid);
  const scoped = expenses.filter((expense) => {
    if (locationId) return expense.locationId === locationId;
    if (!expense.ownerUid || expense.ownerUid === user?.uid) return true;
    const place = expense.locationId ? locations.find((item) => item.id === expense.locationId) : undefined;
    return Boolean(place && userBelongsToLocation(place, mine, user?.uid));
  });
  const monthExpenses = scoped.filter((expense) => expenseInMonth(expense, month) && (tipo === "todos" || expense.tipo === tipo));
  const overdue = scoped.filter((expense) => isExpenseOverdue(expense));
  const dueSoon = scoped.filter((expense) => isDueSoon(expense));
  const expenseIds = { memberId: mine?.id, uid: user?.uid };
  const summary = expenseSummaryInMonth(scoped, month, expenseIds);
  const previousSummary = expenseSummaryInMonth(scoped, addMonths(month, -1), expenseIds);

  const byPerson = useMemo(() => {
    const totals = new Map<string, number>();
    for (const expense of monthExpenses) {
      for (const share of expense.shares) {
        const member = members.find((item) => item.id === share.memberId || item.uid === share.memberId);
        const id = member?.uid || share.memberId;
        totals.set(id, (totals.get(id) || 0) + share.valor);
      }
    }
    return [...totals.entries()]
      .filter(([, valor]) => valor > 0)
      .map(([id, valor]) => ({ id, nome: sharePersonName(id, members, locationInvites), valor }));
  }, [locationInvites, members, monthExpenses]);

  if (loading) return <p className="text-muted">Carregando despesas...</p>;

  function owns(expense: Expense) {
    return !expense.ownerUid || expense.ownerUid === user?.uid;
  }

  function canPay(expense: Expense) {
    return canSettleExpense(expense, { memberId: mine?.id, uid: user?.uid });
  }

  function payLabel(expense: Expense) {
    if (expense.tipo === "parcelada") return "Pagar parcela";
    if (isSharedExpense(expense)) return "Pagar minha parte";
    return "Marcar como paga";
  }

  return (
    <div>
      {!locationId && (
        <PageTitle
          title="Contas a pagar"
          subtitle="Suas despesas. O local é opcional; quando você informa um, a despesa também aparece para quem compartilha aquele consultório."
        />
      )}
      {!locationId && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <MonthTotalCard
            title="Sua participação no mês"
            month={month}
            value={summary.total}
            previous={previousSummary.total}
            invertTone
            footnote="Soma da sua parte nas despesas desta competência."
          />
          <MonthTotalCard
            title="Despesas individuais"
            month={month}
            value={summary.individual}
            previous={previousSummary.individual}
            invertTone
            footnote="Sem rateio com outro profissional."
          />
          <MonthTotalCard
            title="Despesas compartilhadas"
            month={month}
            value={summary.shared}
            previous={previousSummary.shared}
            invertTone
            footnote="Apenas a sua parte do rateio."
          />
          <MonthTotalCard
            title="Faltam pagar no mês"
            month={month}
            value={summary.open}
            previous={previousSummary.open}
            invertTone
            footnote={month === currentMonth ? "Parcelas e rateios ainda em aberto neste mês." : "O que ainda estava em aberto nesta competência."}
          />
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["todos", "Todas"],
              ["fixo", "Fixas"],
              ["variavel", "Variáveis"],
              ["parcelada", "Parceladas"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTipo(value)}
              className={tipo === value ? "btn-chip-active" : "btn-chip"}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
        >
          Nova despesa
        </button>
      </div>
      {(overdue.length > 0 || dueSoon.length > 0) && (
        <Card className="mb-4">
          <h2 className="mb-3 text-lg font-medium text-teal">Vencimentos</h2>
          <div className="grid gap-2">
            {[...overdue, ...dueSoon].map((expense) => (
              <div key={expense.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-paper px-4 py-3">
                <div>
                  <p className="font-medium">{expense.descricao}</p>
                  <p className="text-sm text-muted">
                    {isExpenseOverdue(expense) ? "Em atraso" : "Perto do vencimento"} · {dueLabel(expense.vencimento)}
                    {isSharedExpense(expense) ? ` · ${paidShareCount(expense)}/${expense.shares.length} pagos` : " · individual"}
                    {expense.tipo === "parcelada" ? ` · ${expense.parcelasRestantes} parcela${expense.parcelasRestantes === 1 ? "" : "s"} restante${expense.parcelasRestantes === 1 ? "" : "s"}` : ""}
                  </p>
                </div>
                {canPay(expense) && (
                  <button
                    type="button"
                    className="btn-row"
                    onClick={() => payExpense(expense.id).catch((error) => toast.error(error instanceof Error ? error.message : "Não foi possível registrar o pagamento."))}
                  >
                    {payLabel(expense)}
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_16rem] md:items-center">
            <h2 className="text-2xl font-medium text-teal">{monthLabel(month)}</h2>
            <DateField mode="month" value={month} onChange={setMonth} />
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {byPerson.length === 0 ? (
              <p className="text-sm text-muted">Nenhum rateio neste mês.</p>
            ) : (
              byPerson.map((item) => (
                <Pill key={item.id} tone="teal">
                  <span className="font-num">{item.nome}: {formatMoney(item.valor)}</span>
                </Pill>
              ))
            )}
          </div>
          {monthExpenses.length === 0 ? (
            <Empty>Nenhuma despesa nesta competência.</Empty>
          ) : (
            <DataTable>
              <thead>
                <tr>
                  <Th>Descrição</Th>
                  <Th>Tipo</Th>
                  {!locationId && <Th>Local</Th>}
                  <Th>Vencimento</Th>
                  <Th>Participação</Th>
                  <Th>Status</Th>
                  <Th>Valor</Th>
                  <Th className="text-right">Ações</Th>
                </tr>
              </thead>
              <tbody>
                {monthExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-paper">
                    <Td className="font-medium">
                      {expense.descricao}
                      {expense.tipo === "parcelada" && (
                        <span className="mt-1 block text-xs text-muted">
                          {expense.parcelasRestantes} de {expense.parcelas} · {intervalLabel(expense.intervalo || "mensal")}
                        </span>
                      )}
                      {expense.tipo === "fixo" && expense.intervalo && (
                        <span className="mt-1 block text-xs text-muted">Repete · {intervalLabel(expense.intervalo)}</span>
                      )}
                    </Td>
                    <Td>
                      <Pill tone={expense.tipo === "parcelada" ? "teal" : expense.tipo === "fixo" ? "sage" : "accent"}>{expenseTypeLabel(expense.tipo)}</Pill>
                    </Td>
                    {!locationId && <Td>{expense.locationId ? locationName(expense.locationId) : "Sem local"}</Td>}
                    <Td>
                      {expense.vencimento ? formatDate(expense.vencimento) : "—"}
                      {(isDueSoon(expense) || isExpenseOverdue(expense)) && (
                        <span className="mt-1 block text-xs text-accent">{dueLabel(expense.vencimento)}</span>
                      )}
                    </Td>
                    <Td>
                      <Pill tone={isSharedExpense(expense) ? "teal" : "sage"}>
                        {isSharedExpense(expense) ? "Compartilhado" : "Individual"}
                      </Pill>
                      {isSharedExpense(expense) && (
                        <span className="mt-1 block text-xs text-muted">
                          {expense.shares
                            .map((share) => `${sharePersonName(share.memberId, members, locationInvites)}: ${formatMoney(share.valor)}${share.paga ? " · paga" : ""}`)
                            .join(" · ")}
                        </span>
                      )}
                    </Td>
                    <Td>
                      {isSharedExpense(expense) ? (
                        <span className={paidShareCount(expense) === expense.shares.length ? "font-semibold text-teal" : "font-semibold"}>
                          {paidShareCount(expense)}/{expense.shares.length}
                        </span>
                      ) : (
                        <Pill tone={expense.paga ? "teal" : isExpenseOverdue(expense) ? "accent" : "sage"}>
                          {expense.paga ? "Paga" : isExpenseOverdue(expense) ? "Em atraso" : "Em aberto"}
                        </Pill>
                      )}
                    </Td>
                    <Td className="font-semibold">{formatMoney(expense.valor)}</Td>
                    <Td>
                      <div className="flex justify-end gap-2">
                        {canPay(expense) && (
                          <button
                            type="button"
                            className="btn-row"
                            onClick={() => payExpense(expense.id).catch((error) => toast.error(error instanceof Error ? error.message : "Não foi possível registrar o pagamento."))}
                          >
                            {payLabel(expense)}
                          </button>
                        )}
                        {owns(expense) && (
                          <button
                            type="button"
                            className="btn-row"
                            onClick={() => {
                              setCreating(false);
                              setEditing(expense);
                            }}
                          >
                            Editar
                          </button>
                        )}
                        {owns(expense) && (
                          <button type="button" className="btn-danger" onClick={() => deleteExpense(expense.id)}>
                            Excluir
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          )}
      </Card>
      <Drawer
        open={creating || Boolean(editing)}
        title={editing ? "Editar despesa" : "Nova despesa"}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      >
        {(creating || editing) && (
          <ExpenseForm
            key={editing?.id || "nova"}
            expense={editing || undefined}
            lockedLocationId={locationId}
            onSaved={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        )}
      </Drawer>
    </div>
  );
}
