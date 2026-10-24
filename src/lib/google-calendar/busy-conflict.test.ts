import { describe, expect, it } from "vitest";
import { googleBusyConflicts } from "./busy-conflict";

describe("conflito com Google ocupado", () => {
  it("detecta sobreposição no mesmo dia", () => {
    const blocks = [{ date: "2026-10-24", startTime: "09:00", endTime: "10:00" }];
    expect(
      googleBusyConflicts(blocks, { date: "2026-10-24", startTime: "09:30", endTime: "10:30" })
    ).toBe(true);
    expect(
      googleBusyConflicts(blocks, { date: "2026-10-24", startTime: "10:00", endTime: "11:00" })
    ).toBe(false);
  });
});
