import { describe, expect, it } from "vitest";
import { emptyPatient } from "./types";
import type { Payment } from "./types";
import {
  patientCpfs,
  receitaSaudeMonthSummary,
  receitaSaudeRows,
  receitaSaudeTotals,
} from "./receita-saude-report";

function buildCpf(baseNine: string) {
  const digits = baseNine.replace(/\D/g, "").slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(digits[i]) * (10 - i);
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  const withFirst = `${digits}${check}`;
  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(withFirst[i]) * (11 - i);
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  return `${withFirst}${check}`;
}

function paidPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "pay-1",
    patientId: "pat-1",
    appointmentId: null,
    packageId: null,
    origem: "paciente",
    recorrente: false,
    seriesId: null,
    descricao: "Sessão",
    valor: 200,
    valorAcordado: 200,
    dueDate: "2026-03-10",
    status: "pago",
    paidAt: "2026-03-12T10:00:00.000Z",
    formaPagamento: "pix",
    historico: [
      {
        id: "e1",
        tipo: "pagamento",
        valor: 200,
        data: "2026-03-12",
        formaPagamento: "pix",
        parcial: false,
        observacao: "",
        comprovante: null,
        createdAt: "2026-03-12T10:00:00.000Z",
      },
    ],
    reciboFiscal: null,
    pixTxid: "PSYPAY1",
    lembretesEnviados: 0,
    comprovantePaciente: null,
    createdAt: "2026-03-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("patientCpfs", () => {
  it("usa CPF do paciente quando pagador e beneficiário estão vazios", () => {
    const cpf = buildCpf("390533447");
    const patient = { ...emptyPatient(), id: "p1", createdAt: "", nome: "Ana", cpf };
    const result = patientCpfs(patient);
    expect(result.beneficiary).toBe(cpf);
    expect(result.payer).toBe(cpf);
  });

  it("permite pagador diferente do beneficiário", () => {
    const beneficiary = buildCpf("390533447");
    const payer = buildCpf("529982247");
    const patient = {
      ...emptyPatient(),
      id: "p1",
      createdAt: "",
      nome: "Criança",
      cpf: beneficiary,
      cpfPagador: payer,
      cpfBeneficiario: beneficiary,
    };
    const result = patientCpfs(patient);
    expect(result.payer).toBe(payer);
    expect(result.beneficiary).toBe(beneficiary);
  });
});

describe("receitaSaudeRows", () => {
  it("agrega pagamentos pagos no mês pela data do recebimento", () => {
    const cpf = buildCpf("111444777");
    const patient = {
      ...emptyPatient(),
      id: "pat-1",
      createdAt: "",
      nome: "Paciente",
      cpf,
    };
    const rows = receitaSaudeRows("2026-03", [paidPayment()], [patient], () => "Paciente");
    expect(rows).toHaveLength(1);
    expect(rows[0].valor).toBe(200);
    expect(rows[0].cpfPagador).toBe(cpf);
    const totals = receitaSaudeTotals(rows);
    expect(totals.count).toBe(1);
    expect(totals.total).toBe(200);
  });

  it("ignora lançamentos não pagos", () => {
    const rows = receitaSaudeRows("2026-03", [paidPayment({ status: "em_haver" })], [], () => "");
    expect(rows).toHaveLength(0);
  });
});

describe("receitaSaudeMonthSummary", () => {
  it("conta recibos pendentes", () => {
    const summary = receitaSaudeMonthSummary("2026-03", [paidPayment(), paidPayment({ id: "pay-2", reciboFiscal: null })]);
    expect(summary.paymentCount).toBe(2);
    expect(summary.receiptsPending).toBe(2);
  });
});
