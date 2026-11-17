import { describe, expect, it } from "vitest";
import { CRP_REGIONS, crpRegionForUf, crpUfMismatch, formatCrp } from "./crp";

const ALL_UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

describe("CRP regions (lista oficial do CFP)", () => {
  it("has 24 regionals covering all 27 UFs exactly once", () => {
    expect(CRP_REGIONS).toHaveLength(24);
    const ufs = CRP_REGIONS.flatMap((item) => item.ufs);
    expect([...ufs].sort()).toEqual([...ALL_UFS].sort());
  });

  it.each([
    ["DF", "01"], ["PE", "02"], ["BA", "03"], ["MG", "04"], ["RJ", "05"], ["SP", "06"],
    ["RS", "07"], ["PR", "08"], ["GO", "09"], ["PA", "10"], ["AP", "10"], ["CE", "11"],
    ["SC", "12"], ["PB", "13"], ["MS", "14"], ["AL", "15"], ["ES", "16"], ["RN", "17"],
    ["MT", "18"], ["SE", "19"], ["AM", "20"], ["RR", "20"], ["PI", "21"], ["MA", "22"],
    ["TO", "23"], ["RO", "24"], ["AC", "24"],
  ])("maps %s to CRP-%s", (uf, crp) => {
    expect(crpRegionForUf(uf)).toBe(crp);
  });

  it("flags a regional that does not cover the address UF", () => {
    expect(crpUfMismatch("22", "SC")?.expected.value).toBe("12");
    expect(crpUfMismatch("12", "sc")).toBeNull();
    expect(crpUfMismatch("12", "")).toBeNull();
  });

  it("formats the CRP", () => {
    expect(formatCrp("12345", "12")).toBe("CRP 12/12345");
  });
});
