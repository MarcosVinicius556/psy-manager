/**
 * Tabela progressiva mensal do IRPF (valores por ano-calendário).
 * Fonte: Lei 14.848/2024 e tabelas publicadas pela RFB.
 * Uso: estimativa do Carnê-Leão — confirme no Carnê-Leão Web.
 */

export type IrpfBracket = { upTo: number; rate: number; deduction: number };

const TABLES: Record<number, IrpfBracket[]> = {
  2025: [
    { upTo: 2428.8, rate: 0, deduction: 0 },
    { upTo: 2826.65, rate: 0.075, deduction: 182.16 },
    { upTo: 3751.05, rate: 0.15, deduction: 394.16 },
    { upTo: 4664.68, rate: 0.225, deduction: 675.49 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.275, deduction: 908.73 },
  ],
  2026: [
    { upTo: 2428.8, rate: 0, deduction: 0 },
    { upTo: 2826.65, rate: 0.075, deduction: 182.16 },
    { upTo: 3751.05, rate: 0.15, deduction: 394.16 },
    { upTo: 4664.68, rate: 0.225, deduction: 675.49 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.275, deduction: 908.73 },
  ],
};

export function irpfTableForYear(year: number) {
  return TABLES[year] || TABLES[2026];
}

export function estimateMonthlyIrpf(taxableBase: number, year: number) {
  const base = Math.max(0, Math.round(taxableBase * 100) / 100);
  const table = irpfTableForYear(year);
  const bracket = table.find((row) => base <= row.upTo) || table[table.length - 1];
  const raw = base * bracket.rate - bracket.deduction;
  const tax = Math.max(0, Math.round(raw * 100) / 100);
  return {
    base,
    tax,
    rate: bracket.rate,
    disclaimer:
      "Estimativa com a tabela progressiva mensal. Não inclui deduções legais, dependentes ou recolhimentos já feitos. Confirme no Carnê-Leão Web.",
  };
}

/** Dedução simplificada de 20% sobre rendimentos de trabalho não assalariado (teto legal). */
export function simplifiedCarnelLeaoBase(grossReceived: number, year: number) {
  const gross = Math.max(0, grossReceived);
  const deduction = Math.min(gross * 0.2, year >= 2025 ? 564.8 : 564.8);
  return Math.max(0, Math.round((gross - deduction) * 100) / 100);
}

export function estimateCarnelLeaoFromGross(grossReceived: number, year: number) {
  const taxable = simplifiedCarnelLeaoBase(grossReceived, year);
  const ir = estimateMonthlyIrpf(taxable, year);
  return { grossReceived: grossReceived, taxableBase: taxable, ...ir };
}
