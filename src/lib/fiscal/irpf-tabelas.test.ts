import { describe, expect, it } from "vitest";
import { estimateCarnelLeaoFromGross, estimateMonthlyIrpf, irpfTableForYear } from "./irpf-tabelas";

describe("irpf-tabelas", () => {
  it("expõe tabela para o ano vigente", () => {
    const table = irpfTableForYear(2026);
    expect(table.length).toBeGreaterThanOrEqual(4);
    expect(table[0].rate).toBe(0);
  });

  it("isento até o primeiro limite", () => {
    const result = estimateMonthlyIrpf(2000, 2026);
    expect(result.tax).toBe(0);
  });

  it("estima imposto com dedução simplificada", () => {
    const result = estimateCarnelLeaoFromGross(5000, 2026);
    expect(result.taxableBase).toBeLessThan(5000);
    expect(result.tax).toBeGreaterThanOrEqual(0);
    expect(result.disclaimer).toContain("Carnê-Leão");
  });
});
