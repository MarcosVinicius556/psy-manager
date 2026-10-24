import { formatMoney, shiftDate, todayISO } from "./format";
import type { Appointment, PackageAuditEntry, PackageInterval, PackageType, SessionPackage } from "./types";

const INTERVALS: { value: PackageInterval; label: string; days: number }[] = [
  { value: "semanal", label: "Semanal", days: 7 },
  { value: "quinzenal", label: "Quinzenal", days: 15 },
  { value: "mensal", label: "Mensal", days: 30 },
];

export const PACKAGE_TYPES: { value: PackageType; label: string; days: number; sessoes: number | null }[] = [
  { value: "quinzenal", label: "Quinzenal", days: 15, sessoes: 2 },
  { value: "mensal", label: "Mensal", days: 30, sessoes: 4 },
  { value: "personalizado", label: "Personalizado", days: 30, sessoes: null },
];
export const RECURRENCE_INTERVALS = INTERVALS;
export const SINGLE_SESSION_PACKAGE_MESSAGE =
  "Um pacote com apenas 1 sessão não faz sentido. Para um único atendimento, basta não informar pacote na hora de cadastrar o atendimento.";

export function packagePresetSessions(tipo: PackageType) {
  return PACKAGE_TYPES.find((item) => item.value === tipo)?.sessoes ?? null;
}

export function packageIntervalDays(tipo: PackageType) {
  return PACKAGE_TYPES.find((item) => item.value === tipo)?.days ?? INTERVALS.find((item) => item.value === tipo)?.days ?? 30;
}

export function packageTypeLabel(tipo: PackageType) {
  return PACKAGE_TYPES.find((item) => item.value === tipo)?.label ?? INTERVALS.find((item) => item.value === tipo)?.label ?? "Pacote";
}

export function isPackageInterval(value: string): value is PackageInterval {
  return INTERVALS.some((item) => item.value === value);
}

export function packageSessionDates(start: string, tipo: PackageType, sessoes: number) {
  const count = Math.max(1, Math.floor(sessoes) || 1);
  const span = packageIntervalDays(tipo);
  if (!start || count === 1) return start ? [start] : [];
  const step = span / count;
  const dates: string[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < count; index += 1) {
    const date = shiftDate(start, Math.round(index * step));
    if (seen.has(date)) continue;
    seen.add(date);
    dates.push(date);
  }
  return dates;
}

export function packageSnapshot(pack: SessionPackage, versao?: number | null): PackageAuditEntry {
  const match = versao ? pack.historico.find((item) => item.versao === versao) : undefined;
  if (match) return match;
  return {
    id: `${pack.id}-v${pack.versao || 1}`,
    versao: pack.versao || 1,
    quando: pack.updatedAt || pack.createdAt,
    resumo: "Versão atual",
    nome: pack.nome,
    tipo: pack.tipo,
    valorSessao: pack.valorSessao,
    sessoes: pack.sessoes || 1,
    observacoes: pack.observacoes,
  };
}

export function packageChangeSummary(before: Pick<PackageAuditEntry, "nome" | "tipo" | "valorSessao" | "sessoes" | "observacoes">, after: Pick<PackageAuditEntry, "nome" | "tipo" | "valorSessao" | "sessoes" | "observacoes">) {
  const changes: string[] = [];
  if (before.nome !== after.nome) changes.push(`nome de "${before.nome}" para "${after.nome}"`);
  if (before.tipo !== after.tipo) changes.push(`tipo de ${packageTypeLabel(before.tipo)} para ${packageTypeLabel(after.tipo)}`);
  if (before.valorSessao !== after.valorSessao) changes.push(`valor de ${formatMoney(before.valorSessao)} para ${formatMoney(after.valorSessao)}`);
  if (before.sessoes !== after.sessoes) changes.push(`sessões de ${before.sessoes} para ${after.sessoes}`);
  if (before.observacoes !== after.observacoes) changes.push("observações");
  return changes.join("; ");
}

export function pendingPackageSessions(appointments: Appointment[], patientId: string, ignoreId = "") {
  const today = todayISO();
  return appointments
    .filter(
      (item) =>
        item.patientId === patientId &&
        item.id !== ignoreId &&
        Boolean(item.packageId) &&
        (item.status === "agendado" || item.status === "em_andamento") &&
        item.date >= today
    )
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
}
