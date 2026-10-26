import type { Appointment } from "@/lib/admin/types";
import type { WorkShift } from "@/lib/admin/types";
import { shiftDate, todayISO } from "@/lib/admin/format";
import {
  addMinutes,
  rangesOverlap,
  sessionStartMillis,
  slotStarts,
  toMinutes,
  workRangesForDate,
} from "@/lib/admin/schedule";
import type { BookingSlot } from "./types";

export type TimeBlock = { date: string; startTime: string; endTime: string };

const FREE_STATUSES = new Set(["cancelado", "faltou"]);

function occupiesAppointment(item: Pick<Appointment, "status">) {
  return !FREE_STATUSES.has(item.status);
}

function blockWithBuffer(block: TimeBlock, bufferMinutes: number) {
  return {
    date: block.date,
    startTime: block.startTime,
    endTime: addMinutes(block.endTime, bufferMinutes),
  };
}

function slotBlocked(slot: BookingSlot, block: TimeBlock) {
  if (slot.date !== block.date) return false;
  return rangesOverlap(slot.startTime, slot.endTime, block.startTime, block.endTime);
}

export function computeBookingSlots(options: {
  workHours: WorkShift[];
  durationMinutes: number;
  bufferMinutes: number;
  advanceDays: number;
  minNoticeHours: number;
  appointments: Pick<Appointment, "date" | "startTime" | "endTime" | "status">[];
  pendingRequests: TimeBlock[];
  busyBlocks: TimeBlock[];
  now?: Date;
}): BookingSlot[] {
  const now = options.now ?? new Date();
  const today = todayISO(now);
  const minStartMillis = now.getTime() + options.minNoticeHours * 60 * 60 * 1000;
  const duration = options.durationMinutes;
  const slots: BookingSlot[] = [];

  const appointmentBlocks = options.appointments
    .filter(occupiesAppointment)
    .map((item) => ({ date: item.date, startTime: item.startTime, endTime: item.endTime }));

  const occupied = [
    ...appointmentBlocks.map((b) => blockWithBuffer(b, options.bufferMinutes)),
    ...options.pendingRequests.map((b) => blockWithBuffer(b, options.bufferMinutes)),
    ...options.busyBlocks,
  ];

  for (let offset = 0; offset <= options.advanceDays; offset += 1) {
    const date = shiftDate(today, offset);
    const ranges = workRangesForDate(options.workHours, date);
    if (!ranges.length) continue;

    const starts = slotStarts(duration, ranges);
    for (const startTime of starts) {
      const endTime = addMinutes(startTime, duration);
      const slot: BookingSlot = { date, startTime, endTime };
      if (sessionStartMillis(date, startTime) < minStartMillis) continue;
      if (occupied.some((block) => slotBlocked(slot, block))) continue;
      slots.push(slot);
    }
  }

  return slots.sort(
    (a, b) => sessionStartMillis(a.date, a.startTime) - sessionStartMillis(b.date, b.startTime)
  );
}

export function slotStillFree(
  slot: BookingSlot,
  options: Omit<Parameters<typeof computeBookingSlots>[0], "advanceDays" | "minNoticeHours">
) {
  const duration = options.durationMinutes;
  if (toMinutes(slot.endTime) - toMinutes(slot.startTime) !== duration) return false;
  const all = computeBookingSlots({
    ...options,
    advanceDays: 0,
    minNoticeHours: 0,
    now: new Date(sessionStartMillis(slot.date, slot.startTime) - 1),
  });
  return all.some((item) => item.date === slot.date && item.startTime === slot.startTime);
}
