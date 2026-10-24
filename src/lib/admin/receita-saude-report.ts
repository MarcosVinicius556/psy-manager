import { cpfDigits } from "./cpf";
import { formatDate, formatMoney } from "./format";
import { receivedAmount } from "./finance";
import { maskCpf } from "../masks";
import type { ClinicMember, Patient, Payment } from "./types";

export type ReceitaSaudeRow = {
  paymentId: string;
  patientNome: string;
  dataPagamento: string;
  cpfPagador: string;
  cpfBeneficiario: string;
  valor: number;
  descricao: string;
};

export function patientCpfs(patient: Patient) {
  const beneficiary = cpfDigits(patient.cpfBeneficiario || patient.cpf);
  const payer = cpfDigits(patient.cpfPagador || beneficiary);
  return { payer, beneficiary };
}

function paymentDate(payment: Payment) {
  const events = payment.historico.filter((event) => event.tipo === "pagamento");
  const last = events[events.length - 1];
  if (last?.data) return last.data;
  if (payment.paidAt) return payment.paidAt.slice(0, 10);
  return payment.dueDate;
}

export function receitaSaudeRows(
  month: string,
  payments: Payment[],
  patients: Patient[],
  patientName: (id: string) => string
) {
  const byPatient = new Map(patients.map((item) => [item.id, item]));
  const rows: ReceitaSaudeRow[] = [];
  for (const payment of payments) {
    if (payment.origem !== "paciente" || payment.status !== "pago") continue;
    const date = paymentDate(payment);
    if (!date.startsWith(month)) continue;
    const patient = byPatient.get(payment.patientId);
    const cpfs = patient ? patientCpfs(patient) : { payer: "", beneficiary: "" };
    rows.push({
      paymentId: payment.id,
      patientNome: patient?.nome || patientName(payment.patientId),
      dataPagamento: date,
      cpfPagador: cpfs.payer,
      cpfBeneficiario: cpfs.beneficiary,
      valor: receivedAmount(payment),
      descricao: payment.descricao,
    });
  }
  rows.sort((a, b) => a.dataPagamento.localeCompare(b.dataPagamento) || a.patientNome.localeCompare(b.patientNome));
  return rows;
}

export function receitaSaudeTotals(rows: ReceitaSaudeRow[]) {
  const total = rows.reduce((sum, row) => sum + row.valor, 0);
  return { count: rows.length, total: Math.round(total * 100) / 100 };
}

export const RECEITA_SAUDE_CSV_HEADERS = [
  "Data do pagamento",
  "Paciente",
  "CPF do pagador",
  "CPF do beneficiário",
  "Valor",
  "Descrição",
];

export function receitaSaudeCsvTable(rows: ReceitaSaudeRow[]) {
  return rows.map((row) => [
    formatDate(row.dataPagamento),
    row.patientNome,
    row.cpfPagador ? maskCpf(row.cpfPagador) : "—",
    row.cpfBeneficiario ? maskCpf(row.cpfBeneficiario) : "—",
    formatMoney(row.valor),
    row.descricao,
  ]);
}

export function carnelLeaoImportLine(row: ReceitaSaudeRow, member: ClinicMember, year: number) {
  const [y, m, d] = row.dataPagamento.split("-").map(Number);
  if (y !== year) return null;
  const date = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  const valor = row.valor.toFixed(2).replace(".", ",");
  const profCpf = cpfDigits(member.cpf);
  const registro = formatCrpRegistro(member);
  const descricao = "Sessão de psicoterapia";
  return [
    date,
    "R01.001.001",
    "255",
    valor,
    "",
    descricao,
    "PF",
    row.cpfPagador,
    row.cpfBeneficiario,
    "",
    "",
    "",
    "",
    "S",
    profCpf,
    registro,
  ].join(";");
}

function formatCrpRegistro(member: ClinicMember) {
  const numero = member.crpNumero.replace(/\D/g, "").slice(0, 15);
  const regiao = member.crpRegiao.replace(/\D/g, "").padStart(2, "0").slice(0, 2);
  if (!numero) return "";
  return regiao ? `${regiao}/${numero}` : numero;
}

export function carnelLeaoCsv(rows: ReceitaSaudeRow[], member: ClinicMember, year: number) {
  const lines = rows
    .map((row) => carnelLeaoImportLine(row, member, year))
    .filter((line): line is string => Boolean(line));
  return lines.join("\n");
}

export function professionalFiscalReady(member: ClinicMember | null | undefined) {
  if (!member) return { ok: false, missing: ["cadastro do profissional"] };
  const missing: string[] = [];
  if (!member.nome.trim()) missing.push("nome");
  if (!cpfDigits(member.cpf)) missing.push("CPF");
  if (!member.crpNumero.trim()) missing.push("número do CRP");
  if (!member.crpRegiao.trim()) missing.push("região do CRP");
  return { ok: missing.length === 0, missing };
}
