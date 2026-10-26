import { addMonths, shiftDate, todayISO } from "./format";
import { dueDateMillis } from "./due-date-millis";
import { sessionStartMillis } from "./schedule";

/** Janela padrão da agenda: mês visível ± 1 mês (em ms de início de sessão). */
export function defaultAppointmentWindow(reference = new Date()) {
  const today = todayISO(reference);
  const month = today.slice(0, 7);
  const startDate = shiftDate(`${month}-01`, -31);
  const endMonthStart = `${addMonths(month, 2)}-01`;
  const endDate = shiftDate(endMonthStart, -1);
  const startMillis = sessionStartMillis(startDate, "00:00");
  const endMillis = sessionStartMillis(endDate, "23:59");
  return { startMillis, endMillis };
}

/** Pagamentos com vencimento em torno do mês atual (± 6 meses). */
export function defaultPaymentDueWindow(reference = new Date()) {
  const month = todayISO(reference).slice(0, 7);
  const startDate = `${addMonths(month, -6)}-01`;
  const endDate = shiftDate(`${addMonths(month, 7)}-01`, -1);
  return { startMillis: dueDateMillis(startDate), endMillis: dueDateMillis(endDate) };
}

export function monthDueWindow(isoMonth: string) {
  const startDate = `${isoMonth}-01`;
  const endDate = shiftDate(`${addMonths(isoMonth, 1)}-01`, -1);
  return { startMillis: dueDateMillis(startDate), endMillis: dueDateMillis(endDate) };
}

export function weekAppointmentWindow(weekStartDate: string) {
  const startMillis = sessionStartMillis(weekStartDate, "00:00");
  const endDate = shiftDate(weekStartDate, 6);
  const endMillis = sessionStartMillis(endDate, "23:59");
  return { startMillis, endMillis };
}

export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart <= bEnd && bStart <= aEnd;
}

export function mergeRange(
  loaded: { startMillis: number; endMillis: number } | null,
  next: { startMillis: number; endMillis: number }
) {
  if (!loaded) return next;
  return {
    startMillis: Math.min(loaded.startMillis, next.startMillis),
    endMillis: Math.max(loaded.endMillis, next.endMillis),
  };
}
