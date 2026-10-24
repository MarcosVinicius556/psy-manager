export const CRP_REGIONS = [
  { value: "01", label: "01 — Distrito Federal" },
  { value: "02", label: "02 — Pernambuco" },
  { value: "03", label: "03 — Bahia" },
  { value: "04", label: "04 — Minas Gerais" },
  { value: "05", label: "05 — Rio de Janeiro" },
  { value: "06", label: "06 — São Paulo" },
  { value: "07", label: "07 — Rio Grande do Sul" },
  { value: "08", label: "08 — Paraná" },
  { value: "09", label: "09 — Goiás" },
  { value: "10", label: "10 — Mato Grosso do Sul" },
  { value: "11", label: "11 — Amazonas" },
  { value: "12", label: "12 — Pará" },
  { value: "13", label: "13 — Maranhão" },
  { value: "14", label: "14 — Paraíba" },
  { value: "15", label: "15 — Ceará" },
  { value: "16", label: "16 — Alagoas" },
  { value: "17", label: "17 — Sergipe" },
  { value: "18", label: "18 — Piauí" },
  { value: "19", label: "19 — Rio Grande do Norte" },
  { value: "20", label: "20 — Espírito Santo" },
  { value: "21", label: "21 — Mato Grosso" },
  { value: "22", label: "22 — Santa Catarina" },
  { value: "23", label: "23 — Acre" },
  { value: "24", label: "24 — Rondônia" },
] as const;

export function formatCrp(numero: string, regiao: string) {
  const n = numero.replace(/\D/g, "").trim();
  const r = regiao.replace(/\D/g, "").padStart(2, "0").slice(0, 2);
  if (!n && !r) return "";
  if (!n) return `CRP ${r}`;
  if (!r) return `CRP ${n}`;
  return `CRP ${r}/${n}`;
}
