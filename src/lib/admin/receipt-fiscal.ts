import { cpfDigits } from "./cpf";
import { formatCrp } from "./crp";
import { formatDate, formatMoney } from "./format";
import { moneyInWords } from "./money-words";
import { maskCpf } from "../masks";
import type { ClinicMember, Patient, Payment } from "./types";
import { patientCpfs } from "./receita-saude-report";
import { receivedAmount } from "./finance";

export type FiscalReceiptContext = {
  payment: Payment;
  patient: Patient | null;
  professional: ClinicMember;
  receiptNumber: number;
  paymentDate: string;
};

export function fiscalReceiptFilename(ctx: FiscalReceiptContext) {
  const slug = ctx.patient?.nome.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "pagamento";
  return `recibo-${ctx.receiptNumber}-${slug}.pdf`;
}

function professionalAddress(member: ClinicMember) {
  const parts = [
    member.enderecoLogradouro.trim(),
    member.enderecoCidade.trim() && member.enderecoUf.trim()
      ? `${member.enderecoCidade.trim()} — ${member.enderecoUf.trim()}`
      : member.enderecoCidade.trim() || member.enderecoUf.trim(),
    member.enderecoCep.trim() ? `CEP ${member.enderecoCep.trim()}` : "",
  ].filter(Boolean);
  return parts.join(", ");
}

export async function createFiscalReceiptPdf(ctx: FiscalReceiptContext) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const usable = pageWidth - margin * 2;
  const ink: [number, number, number] = [36, 48, 40];
  const teal: [number, number, number] = [61, 82, 64];
  const muted: [number, number, number] = [90, 103, 92];
  const valor = receivedAmount(ctx.payment);
  const cpfs = ctx.patient ? patientCpfs(ctx.patient) : { payer: "", beneficiary: "" };
  const crp = formatCrp(ctx.professional.crpNumero, ctx.professional.crpRegiao);
  const profCpf = maskCpf(ctx.professional.cpf);
  const address = professionalAddress(ctx.professional);

  doc.setProperties({
    title: `Recibo nº ${ctx.receiptNumber}`,
    subject: "Recibo de prestação de serviços de psicoterapia",
  });

  let y = 24;
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(teal[0], teal[1], teal[2]);
  doc.text("Recibo de pagamento", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text(`Nº ${String(ctx.receiptNumber).padStart(6, "0")} · ${formatDate(ctx.paymentDate)}`, margin, y);
  y += 12;

  const lines: [string, string][] = [
    ["Prestador", ctx.professional.nome.trim()],
    ["CPF do prestador", profCpf || "—"],
    ["Conselho", crp || "—"],
    ["Endereço", address || "—"],
    ["", ""],
    ["Serviço", "Sessão de psicoterapia"],
    ["Valor", formatMoney(valor)],
    ["Valor por extenso", moneyInWords(valor)],
    ["Data do pagamento", formatDate(ctx.paymentDate)],
    ["Forma de pagamento", ctx.payment.formaPagamento ? ctx.payment.formaPagamento.toUpperCase() : "—"],
    ["", ""],
    ["Pagador (CPF)", cpfs.payer ? maskCpf(cpfs.payer) : "—"],
    ["Beneficiário (CPF)", cpfs.beneficiary ? maskCpf(cpfs.beneficiary) : "—"],
    ["Paciente / beneficiário", ctx.patient?.nome.trim() || "—"],
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  for (const [label, value] of lines) {
    if (!label && !value) {
      y += 4;
      continue;
    }
    doc.setFont("helvetica", "bold");
    doc.setTextColor(teal[0], teal[1], teal[2]);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(ink[0], ink[1], ink[2]);
    const wrapped = doc.splitTextToSize(value, usable - 52);
    doc.text(wrapped, margin + 52, y);
    y += Math.max(6, wrapped.length * 5.2);
  }

  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  const note = doc.splitTextToSize(
    "Este documento é um recibo emitido pelo profissional para controle e entrega ao paciente. O recibo oficial do Receita Saúde deve ser emitido no aplicativo Receita Federal ou no Carnê-Leão Web (e-CAC), conforme a IN RFB nº 2.240/2024.",
    usable
  );
  doc.text(note, margin, y);
  y += note.length * 4 + 16;

  doc.setDrawColor(teal[0], teal[1], teal[2]);
  doc.line(margin, y, margin + 70, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(ink[0], ink[1], ink[2]);
  doc.text(ctx.professional.nome.trim(), margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text(`${crp || "CRP"} · CPF ${profCpf}`, margin, y);

  const buffer = doc.output("arraybuffer");
  const bytes = new Uint8Array(buffer);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: "application/pdf" });
}

export function nextReceiptNumber(member: ClinicMember, payments: Payment[]) {
  const fromMember = member.reciboSequencia || 0;
  const fromPayments = payments.reduce((max, payment) => Math.max(max, payment.reciboFiscal?.numero || 0), 0);
  return Math.max(fromMember, fromPayments) + 1;
}

export function paymentReceiptDate(payment: Payment) {
  const events = payment.historico.filter((event) => event.tipo === "pagamento");
  const last = events[events.length - 1];
  if (last?.data) return last.data;
  if (payment.paidAt) return payment.paidAt.slice(0, 10);
  return payment.dueDate;
}

export function canIssueFiscalReceipt(payment: Payment) {
  return payment.status === "pago" && receivedAmount(payment) > 0;
}

export function stripCpfFields<T extends { cpf?: string; cpfPagador?: string; cpfBeneficiario?: string }>(input: T) {
  return {
    ...input,
    cpf: input.cpf ? cpfDigits(input.cpf) : "",
    cpfPagador: input.cpfPagador ? cpfDigits(input.cpfPagador) : "",
    cpfBeneficiario: input.cpfBeneficiario ? cpfDigits(input.cpfBeneficiario) : "",
  };
}
