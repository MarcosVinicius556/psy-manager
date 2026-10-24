import { shiftDate, startOfWeek, todayISO } from "./format";
import type { Expense, ExpenseInput, InstallmentInterval } from "./types";

export const DUE_SOON_DAYS = 3;

export function addMonthsDate(iso: string, delta: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const cursor = new Date(year, month - 1 + delta, 1);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  cursor.setDate(Math.min(day || 1, last));
  return todayISO(cursor);
}

export function installmentDates(start: string, count: number, interval: InstallmentInterval) {
  const total = Math.max(0, Math.floor(count));
  return Array.from({ length: total }, (_, index) => {
    if (interval === "semanal") return shiftDate(start, index * 7);
    if (interval === "anual") return addMonthsDate(start, index * 12);
    return addMonthsDate(start, index);
  });
}

export function daysUntil(iso: string, today = todayISO()) {
  if (!iso || !today) return Number.POSITIVE_INFINITY;
  const [year, month, day] = iso.split("-").map(Number);
  const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);
  const due = Date.UTC(year, month - 1, day);
  const now = Date.UTC(todayYear, todayMonth - 1, todayDay);
  return Math.round((due - now) / 86400000);
}

export function isSharedExpense(expense: Pick<Expense, "shares">) {
  return expense.shares.length > 1;
}

export function shareBelongsTo(
  share: { memberId: string },
  ids: { memberId?: string | null; uid?: string | null }
) {
  if (ids.uid && share.memberId === ids.uid) return true;
  return Boolean(ids.memberId && share.memberId === ids.memberId);
}

export function canSettleExpense(
  expense: Pick<Expense, "tipo" | "vencimento" | "paga" | "parcelasRestantes" | "shares">,
  ids: { memberId?: string | null; uid?: string | null }
) {
  if (expense.tipo === "parcelada") return expense.parcelasRestantes > 0;
  if (!expense.vencimento || expense.paga) return false;
  if (!isSharedExpense(expense)) return true;
  const share = expense.shares.find((item) => shareBelongsTo(item, ids));
  return Boolean(share && !share.paga);
}

export function paidShareCount(expense: Pick<Expense, "paga" | "shares">) {
  if (expense.paga) return Math.max(expense.shares.length, 1);
  return expense.shares.filter((share) => share.paga).length;
}

export function isExpenseOpen(expense: Pick<Expense, "tipo" | "paga" | "parcelasRestantes" | "shares">) {
  if (expense.paga) return false;
  if (expense.tipo === "parcelada") return expense.parcelasRestantes > 0;
  if (isSharedExpense(expense)) return expense.shares.some((share) => !share.paga);
  return true;
}

export function isExpenseOverdue(expense: Pick<Expense, "tipo" | "vencimento" | "paga" | "parcelasRestantes" | "shares">, today = todayISO()) {
  if (!expense.vencimento || !isExpenseOpen(expense)) return false;
  return daysUntil(expense.vencimento, today) < 0;
}

export function isDueSoon(expense: Pick<Expense, "tipo" | "vencimento" | "paga" | "parcelasRestantes" | "shares">, today = todayISO()) {
  if (!expense.vencimento || !isExpenseOpen(expense)) return false;
  const days = daysUntil(expense.vencimento, today);
  return days >= 0 && days <= DUE_SOON_DAYS;
}

export function isExpenseAlert(expense: Pick<Expense, "tipo" | "vencimento" | "paga" | "parcelasRestantes" | "shares">, today = todayISO()) {
  return isExpenseOverdue(expense, today) || isDueSoon(expense, today);
}

export function nextRecurringDue(due: string, interval: InstallmentInterval) {
  if (interval === "semanal") return shiftDate(due, 7);
  if (interval === "anual") return addMonthsDate(due, 12);
  return addMonthsDate(due, 1);
}

export const MAX_PAST_RECURRENCES = 36;

export function installmentValue(total: number, count: number) {
  const parcels = Math.floor(count);
  if (!Number.isFinite(total)) return 0;
  if (parcels <= 1) return Math.round(total * 100) / 100;
  return Math.round((total / parcels) * 100) / 100;
}

export function recurringDatesBefore(start: string, interval: InstallmentInterval, today = todayISO()) {
  const dates: string[] = [];
  let cursor = start;
  while (cursor && cursor < today && dates.length <= MAX_PAST_RECURRENCES) {
    dates.push(cursor);
    const next = nextRecurringDue(cursor, interval);
    if (!next || next <= cursor) break;
    cursor = next;
  }
  return dates;
}

export function recurrenceOpensOn(due: string, interval: InstallmentInterval) {
  if (interval === "semanal") return startOfWeek(due);
  return `${due.slice(0, 7)}-01`;
}

export function pendingRecurringCopies(expenses: Expense[], today = todayISO()) {
  const groups = new Map<string, Expense[]>();
  for (const expense of expenses) {
    if (expense.tipo !== "fixo" || !expense.intervalo || !expense.vencimento || !expense.ownerUid) continue;
    const key = expense.serieId || expense.id;
    const list = groups.get(key) ?? [];
    list.push(expense);
    groups.set(key, list);
  }
  const copies: { input: ExpenseInput; accessUids: string[] }[] = [];
  for (const [key, group] of groups) {
    const known = new Set(group.map((expense) => expense.vencimento));
    let latest = [...group].sort((a, b) => a.vencimento.localeCompare(b.vencimento)).at(-1);
    if (!latest) continue;
    for (let guard = 0; guard < 24; guard += 1) {
      const interval = latest.intervalo;
      if (!interval) break;
      const due = nextRecurringDue(latest.vencimento, interval);
      if (today < recurrenceOpensOn(due, interval)) break;
      if (known.has(due)) break;
      known.add(due);
      copies.push({
        accessUids: latest.accessUids,
        input: {
          locationId: latest.locationId,
          descricao: latest.descricao,
          tipo: "fixo",
          valor: latest.valor,
          competencia: due.slice(0, 7),
          vencimento: due,
          paga: false,
          inicio: "",
          parcelas: 0,
          parcelasRestantes: 0,
          intervalo: interval,
          serieId: key,
          observacoes: latest.observacoes,
          shares: latest.shares.map((share) => ({ memberId: share.memberId, valor: share.valor, paga: false })),
        },
      });
      latest = { ...latest, vencimento: due, competencia: due.slice(0, 7) };
    }
  }
  return copies;
}

export function expenseTypeLabel(tipo: Expense["tipo"]) {
  if (tipo === "parcelada") return "Parcelada";
  if (tipo === "variavel") return "Variável";
  return "Fixa";
}

export function intervalLabel(interval: InstallmentInterval) {
  if (interval === "semanal") return "Semanal";
  if (interval === "anual") return "Anual";
  return "Mensal";
}

export function expenseInMonth(expense: Expense, month: string) {
  return expenseMonths(expense).some((item) => item.month === month);
}

function expenseMonths(expense: Expense) {
  if (expense.tipo === "parcelada" && expense.inicio && expense.intervalo && expense.parcelas > 0) {
    const dates = installmentDates(expense.inicio, expense.parcelas, expense.intervalo);
    const paid = Math.max(0, expense.parcelas - Math.max(0, expense.parcelasRestantes));
    return dates.map((date, index) => ({ month: date.slice(0, 7), open: index >= paid }));
  }
  const month = (expense.vencimento || expense.competencia || "").slice(0, 7);
  if (!month) return [];
  return [{ month, open: isExpenseOpen(expense) }];
}

export function expenseUserShare(
  expense: Expense,
  ids: { memberId?: string | null; uid?: string | null },
  openOnly = false
) {
  if (expense.shares.length > 0) {
    const share = expense.shares.find((item) => shareBelongsTo(item, ids));
    if (!share) return 0;
    if (openOnly && (share.paga || (expense.tipo === "parcelada" && expense.parcelasRestantes <= 0))) return 0;
    return share.valor;
  }
  if (expense.ownerUid && ids.uid && expense.ownerUid !== ids.uid) return 0;
  if (openOnly && !isExpenseOpen(expense)) return 0;
  return expense.valor;
}

export type ExpenseMonthSummary = {
  total: number;
  individual: number;
  shared: number;
  open: number;
};

export function expenseSummaryInMonth(
  expenses: Expense[],
  month: string,
  ids: { memberId?: string | null; uid?: string | null }
) {
  const summary: ExpenseMonthSummary = { total: 0, individual: 0, shared: 0, open: 0 };
  for (const expense of expenses) {
    const slot = expenseMonths(expense).find((item) => item.month === month);
    if (!slot) continue;
    const amount = expenseUserShare(expense, ids, false);
    if (amount <= 0) continue;
    const open = slot.open ? expenseUserShare(expense, ids, true) : 0;
    summary.total = Math.round((summary.total + amount) * 100) / 100;
    summary.open = Math.round((summary.open + open) * 100) / 100;
    if (isSharedExpense(expense)) summary.shared = Math.round((summary.shared + amount) * 100) / 100;
    else summary.individual = Math.round((summary.individual + amount) * 100) / 100;
  }
  return summary;
}

function listedExpenseMonths(expenses: Expense[]) {
  return expenses.flatMap((expense) => expenseMonths(expense).map((item) => item.month)).filter(Boolean);
}

export function earliestExpenseMonth(expenses: Expense[], current: string) {
  return listedExpenseMonths(expenses).sort()[0] || current;
}

export function latestExpenseMonth(expenses: Expense[], fromMonth: string) {
  const future = listedExpenseMonths(expenses).filter((month) => month >= fromMonth);
  return future.sort().at(-1) || fromMonth;
}

export function dueLabel(iso: string, today = todayISO()) {
  const days = daysUntil(iso, today);
  if (!Number.isFinite(days)) return "";
  if (days < 0) return days === -1 ? "Venceu ontem" : `Venceu há ${Math.abs(days)} dias`;
  if (days === 0) return "Vence hoje";
  if (days === 1) return "Vence amanhã";
  return `Vence em ${days} dias`;
}
