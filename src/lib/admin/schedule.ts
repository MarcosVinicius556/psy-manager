import type { Appointment, AppointmentInput, WorkShift } from "./types";
import { shiftDate, todayISO } from "./format";

export const SCHEDULE_START = 7 * 60;
export const SCHEDULE_END = 21 * 60;
export const SLOT_STEP = 30;

export function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

export function fromMinutes(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function isBookableStart(date: string, startTime: string, now = new Date()) {
  if (!date || !startTime) return false;
  const today = todayISO(now);
  if (date > today) return true;
  if (date < today) return false;
  return toMinutes(startTime) > now.getHours() * 60 + now.getMinutes();
}

/** Horário local de início da sessão (ms), usado em regras de compartilhamento. */
export function sessionStartMillis(date: string, startTime: string) {
  if (!date || !startTime) return 0;
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = startTime.split(":").map(Number);
  if ([year, month, day, hours, minutes].some((n) => Number.isNaN(n))) return 0;
  return new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();
}

export function addMinutes(time: string, minutes: number) {
  return fromMinutes(toMinutes(time) + minutes);
}

export function shiftsToSlotKeys(shifts: WorkShift[]) {
  const keys: string[] = [];
  for (const shift of shifts) {
    let minute = toMinutes(shift.startTime);
    const end = toMinutes(shift.endTime);
    while (minute < end) {
      keys.push(`${shift.weekday}|${fromMinutes(minute)}`);
      minute += SLOT_STEP;
    }
  }
  return keys;
}

export function slotKeysToShifts(keys: string[]): WorkShift[] {
  const byDay = new Map<number, number[]>();
  for (const key of keys) {
    const [dayText, time] = key.split("|");
    const weekday = Number(dayText);
    const list = byDay.get(weekday) ?? [];
    list.push(toMinutes(time));
    byDay.set(weekday, list);
  }
  const shifts: WorkShift[] = [];
  for (const [weekday, minutes] of byDay) {
    const sorted = [...new Set(minutes)].sort((a, b) => a - b);
    let start = sorted[0];
    let previous = sorted[0];
    for (let index = 1; index <= sorted.length; index += 1) {
      const current = sorted[index];
      if (current === previous + SLOT_STEP) {
        previous = current;
        continue;
      }
      shifts.push({ weekday, startTime: fromMinutes(start), endTime: fromMinutes(previous + SLOT_STEP) });
      start = current;
      previous = current;
    }
  }
  return shifts.sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime));
}

export function weekdayOf(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

export function slotStarts(duration: number, ranges?: { startTime: string; endTime: string }[]) {
  if (ranges && ranges.length === 0) return [];
  const windows = ranges && ranges.length > 0 ? ranges : [{ startTime: fromMinutes(SCHEDULE_START), endTime: fromMinutes(SCHEDULE_END) }];
  const starts: string[] = [];
  for (const range of windows) {
    const start = toMinutes(range.startTime);
    const end = toMinutes(range.endTime);
    for (let minute = start; minute + duration <= end; minute += SLOT_STEP) {
      starts.push(fromMinutes(minute));
    }
  }
  return [...new Set(starts)].sort();
}

export function timelineSlots(ranges?: { startTime: string; endTime: string }[]) {
  if (ranges && ranges.length === 0) return [];
  const windows = ranges && ranges.length > 0 ? ranges : [{ startTime: fromMinutes(SCHEDULE_START), endTime: fromMinutes(SCHEDULE_END) }];
  const slots: string[] = [];
  for (const range of windows) {
    const start = toMinutes(range.startTime);
    const end = toMinutes(range.endTime);
    for (let minute = start; minute < end; minute += SLOT_STEP) {
      slots.push(fromMinutes(minute));
    }
  }
  return [...new Set(slots)].sort();
}

export function workRangesForDate(hours: WorkShift[], iso: string) {
  if (!iso) return [];
  const weekday = weekdayOf(iso);
  return hours.filter((shift) => shift.weekday === weekday);
}

export function fitsWorkHours(hours: WorkShift[], iso: string, startTime: string, endTime: string) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (end <= start) return false;
  if (!hours.length) return start >= SCHEDULE_START && end <= SCHEDULE_END;
  return workRangesForDate(hours, iso).some(
    (range) => start >= toMinutes(range.startTime) && end <= toMinutes(range.endTime)
  );
}

export function rangesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);
}

const freeStatuses = new Set(["cancelado", "faltou"]);

function occupies(item: Appointment) {
  return !freeStatuses.has(item.status);
}

type SlotCandidate = Pick<
  AppointmentInput,
  "date" | "startTime" | "endTime" | "modality" | "locationId" | "professionalId"
>;

export function findLocationConflict(
  appointments: Appointment[],
  candidate: SlotCandidate,
  ignoreId?: string
) {
  if (!candidate.locationId) return null;
  return (
    appointments.find((item) => {
      if (ignoreId && item.id === ignoreId) return false;
      if (!occupies(item)) return false;
      if (item.locationId !== candidate.locationId) return false;
      if (item.date !== candidate.date) return false;
      return rangesOverlap(candidate.startTime, candidate.endTime, item.startTime, item.endTime);
    }) ?? null
  );
}

export function findProfessionalConflict(
  appointments: Appointment[],
  candidate: SlotCandidate,
  ignoreId?: string
) {
  if (!candidate.professionalId) return null;
  return (
    appointments.find((item) => {
      if (ignoreId && item.id === ignoreId) return false;
      if (!occupies(item)) return false;
      if (item.professionalId !== candidate.professionalId) return false;
      if (item.date !== candidate.date) return false;
      return rangesOverlap(candidate.startTime, candidate.endTime, item.startTime, item.endTime);
    }) ?? null
  );
}

export function recurrenceDates(start: string, until: string, weekdays: number[]) {
  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const [endYear, endMonth, endDay] = until.split("-").map(Number);
  const cursor = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  const dates: string[] = [];
  while (cursor <= end) {
    if (weekdays.includes(cursor.getDay())) dates.push(todayISO(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function intervalDates(start: string, until: string, days: number) {
  if (!start || !until || days <= 0 || until < start) return [];
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= until && dates.length < 60) {
    dates.push(cursor);
    cursor = shiftDate(cursor, days);
  }
  return dates;
}

export function splitEvenly(total: number, count: number) {
  if (count <= 0) return [];
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  let remainder = cents - base * count;
  return Array.from({ length: count }, () => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return (base + extra) / 100;
  });
}

export function sharesMatchTotal(total: number, shares: { valor: number }[]) {
  const allocated = Math.round(shares.reduce((sum, share) => sum + share.valor, 0) * 100);
  return allocated === Math.round(total * 100);
}
