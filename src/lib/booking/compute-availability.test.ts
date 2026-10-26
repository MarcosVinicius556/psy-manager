import { describe, expect, it } from "vitest";
import { computeBookingSlots, slotStillFree } from "./compute-availability";

const workHours = [{ weekday: 1, startTime: "09:00", endTime: "12:00" }];

describe("computeBookingSlots", () => {
  it("não oferece horário ocupado por sessão existente", () => {
    const monday = "2026-10-26";
    const slots = computeBookingSlots({
      workHours,
      durationMinutes: 50,
      bufferMinutes: 10,
      advanceDays: 0,
      minNoticeHours: 0,
      appointments: [{ date: monday, startTime: "09:00", endTime: "09:50", status: "agendado" }],
      pendingRequests: [],
      busyBlocks: [],
      now: new Date("2026-10-26T08:00:00"),
    });
    expect(slots.some((s) => s.startTime === "09:00")).toBe(false);
    expect(slots.some((s) => s.startTime === "10:00")).toBe(true);
  });

  it("respeita antecedência mínima", () => {
    const slots = computeBookingSlots({
      workHours,
      durationMinutes: 50,
      bufferMinutes: 0,
      advanceDays: 0,
      minNoticeHours: 24,
      appointments: [],
      pendingRequests: [],
      busyBlocks: [],
      now: new Date("2026-10-26T10:00:00"),
    });
    expect(slots.length).toBe(0);
  });

  it("slotStillFree confere com lista calculada", () => {
    const slot = { date: "2026-10-26", startTime: "10:00", endTime: "10:50" };
    const ok = slotStillFree(slot, {
      workHours,
      durationMinutes: 50,
      bufferMinutes: 10,
      appointments: [],
      pendingRequests: [],
      busyBlocks: [],
    });
    expect(ok).toBe(true);
  });
});
