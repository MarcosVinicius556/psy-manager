import { describe, expect, it } from "vitest";
import { defaultAppointmentWindow, defaultPaymentDueWindow, monthDueWindow, rangesOverlap } from "./clinic-load-windows";

describe("clinic-load-windows", () => {
  it("default appointment window spans about three months", () => {
    const ref = new Date("2026-06-15T12:00:00");
    const { startMillis, endMillis } = defaultAppointmentWindow(ref);
    expect(endMillis).toBeGreaterThan(startMillis);
    const days = (endMillis - startMillis) / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(60);
    expect(days).toBeLessThan(120);
  });

  it("default payment window covers current month ± 6", () => {
    const ref = new Date("2026-06-15T12:00:00");
    const { startMillis, endMillis } = defaultPaymentDueWindow(ref);
    expect(startMillis).toBeLessThan(endMillis);
    const monthWindow = monthDueWindow("2026-06");
    expect(rangesOverlap(startMillis, endMillis, monthWindow.startMillis, monthWindow.endMillis)).toBe(true);
  });
});
