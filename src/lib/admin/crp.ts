/**
 * Conselhos Regionais de Psicologia (CRP) e as UFs de cada jurisdição.
 *
 * Fonte oficial: Conselho Federal de Psicologia — "Profissionais por regional"
 * (https://transparencia.cfp.org.br/psicologo/psicologos-por-regional/) e
 * "Conselhos pelo Brasil" (https://site.cfp.org.br/cfp/sistema-conselhos/conselhos-pelo-brasil/).
 * Conferido em 11/11/2026: são 24 regionais; 10ª (PA e AP), 20ª (AM e RR) e
 * 24ª (RO e AC) atendem mais de uma UF.
 *
 * O valor gravado no cadastro (`crpRegiao`) continua sendo o número da regional
 * com dois dígitos ("01".."24"), então registros antigos seguem válidos.
 */
export type CrpRegion = {
  value: string;
  ufs: readonly string[];
  estados: string;
  label: string;
};

const RAW: { value: string; ufs: string[]; estados: string }[] = [
  { value: "01", ufs: ["DF"], estados: "Distrito Federal" },
  { value: "02", ufs: ["PE"], estados: "Pernambuco" },
  { value: "03", ufs: ["BA"], estados: "Bahia" },
  { value: "04", ufs: ["MG"], estados: "Minas Gerais" },
  { value: "05", ufs: ["RJ"], estados: "Rio de Janeiro" },
  { value: "06", ufs: ["SP"], estados: "São Paulo" },
  { value: "07", ufs: ["RS"], estados: "Rio Grande do Sul" },
  { value: "08", ufs: ["PR"], estados: "Paraná" },
  { value: "09", ufs: ["GO"], estados: "Goiás" },
  { value: "10", ufs: ["PA", "AP"], estados: "Pará e Amapá" },
  { value: "11", ufs: ["CE"], estados: "Ceará" },
  { value: "12", ufs: ["SC"], estados: "Santa Catarina" },
  { value: "13", ufs: ["PB"], estados: "Paraíba" },
  { value: "14", ufs: ["MS"], estados: "Mato Grosso do Sul" },
  { value: "15", ufs: ["AL"], estados: "Alagoas" },
  { value: "16", ufs: ["ES"], estados: "Espírito Santo" },
  { value: "17", ufs: ["RN"], estados: "Rio Grande do Norte" },
  { value: "18", ufs: ["MT"], estados: "Mato Grosso" },
  { value: "19", ufs: ["SE"], estados: "Sergipe" },
  { value: "20", ufs: ["AM", "RR"], estados: "Amazonas e Roraima" },
  { value: "21", ufs: ["PI"], estados: "Piauí" },
  { value: "22", ufs: ["MA"], estados: "Maranhão" },
  { value: "23", ufs: ["TO"], estados: "Tocantins" },
  { value: "24", ufs: ["RO", "AC"], estados: "Rondônia e Acre" },
];

export const CRP_REGIONS: readonly CrpRegion[] = RAW.map((item) => ({
  ...item,
  label: `${item.value} — ${item.estados} (${item.ufs.join("/")})`,
}));

const UF_TO_CRP = new Map<string, string>(CRP_REGIONS.flatMap((item) => item.ufs.map((uf) => [uf, item.value] as const)));

/** Número da regional (ex.: "12") para a UF informada, ou "" se a UF não existir. */
export function crpRegionForUf(uf: string) {
  return UF_TO_CRP.get(uf.trim().toUpperCase()) ?? "";
}

export function crpRegionInfo(regiao: string) {
  const r = regiao.replace(/\D/g, "").padStart(2, "0").slice(0, 2);
  return CRP_REGIONS.find((item) => item.value === r) ?? null;
}

/**
 * Aviso quando a regional escolhida não cobre a UF do endereço profissional.
 * Ajuda a corrigir cadastros feitos com a lista antiga, que tinha números trocados.
 */
export function crpUfMismatch(regiao: string, uf: string) {
  const info = crpRegionInfo(regiao);
  const expected = crpRegionForUf(uf);
  if (!info || !expected || info.value === expected) return null;
  return { selected: info, expected: crpRegionInfo(expected)! };
}

export function formatCrp(numero: string, regiao: string) {
  const n = numero.replace(/\D/g, "").trim();
  const r = regiao.replace(/\D/g, "").padStart(2, "0").slice(0, 2);
  if (!n && !r) return "";
  if (!n) return `CRP ${r}`;
  if (!r) return `CRP ${n}`;
  return `CRP ${r}/${n}`;
}
