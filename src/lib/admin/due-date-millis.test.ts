import { describe, expect, it } from "vitest";
import { dueDateMillis } from "./due-date-millis";

describe("dueDateMillis", () => {
  it("parses yyyy-mm-dd at local midnight", () => {
    const ms = dueDateMillis("2026-03-15");
    const d = new Date(ms);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(15);
  });

  it("returns 0 for invalid input", () => {
    expect(dueDateMillis("")).toBe(0);
    expect(dueDateMillis("invalid")).toBe(0);
  });
});
