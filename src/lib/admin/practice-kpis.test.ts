import { describe, expect, it } from "vitest";
import { averageSessionRating, noShowRate } from "./practice-kpis";

describe("practice kpis", () => {
  it("calcula taxa de faltas", () => {
    const now = Date.parse("2026-10-20T12:00:00.000Z");
    const rate = noShowRate(
      [
        { status: "faltou", sessionStartMillis: now - 86400000, date: "2026-10-19", startTime: "10:00" } as never,
        { status: "concluido", sessionStartMillis: now - 172800000, date: "2026-10-18", startTime: "10:00" } as never,
      ],
      90,
      now
    );
    expect(rate).toBe(50);
  });

  it("calcula média de estrelas", () => {
    const avg = averageSessionRating([
      { stars: 5 } as never,
      { stars: 3 } as never,
    ]);
    expect(avg).toBe(4);
  });
});
