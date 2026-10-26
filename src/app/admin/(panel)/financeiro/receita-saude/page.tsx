"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import MonthTotalCard from "@/components/admin/MonthTotalCard";
import { Card, Empty, MobileListGrid, PageTitle, ResponsiveTableWrap, Td, Th } from "@/components/admin/ui";
import ListCard from "@/components/admin/mobile/ListCard";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import { getMonthClosing } from "@/lib/admin/collections";
import { addMonths, formatDate, formatMoney, monthLabel, todayISO } from "@/lib/admin/format";
import { estimateCarnelLeaoFromGross } from "@/lib/fiscal/irpf-tabelas";
import { maskCpf } from "@/lib/masks";
import {
  RECEITA_SAUDE_CSV_HEADERS,
  carnelLeaoCsv,
  patientsMissingCpf,
  pendingFiscalReceipts,
  professionalFiscalReady,
  receitaSaudeCsvTable,
  receitaSaudeMonthSummary,
  receitaSaudeRows,
  receitaSaudeTotals,
  type MonthClosingRecord,
} from "@/lib/admin/receita-saude-report";
import { createReportPdf, downloadCsv, downloadPdfBlob } from "@/lib/admin/reports";

export default function ReceitaSaudePage() {
  const { user } = useAuth();
  const { payments, patients, members, loading, patientName, issueFiscalReceiptBatch, closeReceitaSaudeMonth } = useClinic();
  const currentMonth = todayISO().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [exporting, setExporting] = useState<"csv" | "pdf" | "carnel" | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [closingBusy, setClosingBusy] = useState(false);
  const [closing, setClosing] = useState<MonthClosingRecord | null>(null);
  const me = members.find((member) => member.uid === user?.uid || member.email === user?.email?.toLowerCase());
  const fiscal = professionalFiscalReady(me);

  useEffect(() => {
    if (loading) return;
    void getMonthClosing(month).then(setClosing);
  }, [loading, month]);

  const rows = useMemo(
    () => (loading ? [] : receitaSaudeRows(month, payments, patients, patientName)),
    [loading, month, payments, patients, patientName]
  );
  const totals = receitaSaudeTotals(rows);
  const summary = useMemo(() => receitaSaudeMonthSummary(month, payments), [month, payments]);
  const pendingReceipts = useMemo(() => pendingFiscalReceipts(month, payments), [month, payments]);
  const missingCpf = useMemo(() => patientsMissingCpf(month, payments, patients), [month, payments, patients]);
  const table = receitaSaudeCsvTable(rows);
  const reportTitle = `Receita Saúde — ${monthLabel(month)}`;
  const year = Number(month.slice(0, 4));
  const taxEstimate = estimateCarnelLeaoFromGross(summary.receivedTotal, year);

  async function exportPdf() {
    setExporting("pdf");
    try {
      const blob = await createReportPdf({
        nome: reportTitle,
        description: "Pagamentos recebidos no mês (dados para lançamento no Receita Saúde)",
        generatedAt: new Date().toLocaleString("pt-BR"),
        headers: RECEITA_SAUDE_CSV_HEADERS,
        table,
      });
      downloadPdfBlob(blob, reportTitle);
    } finally {
      setExporting(null);
    }
  }

  function exportCsv() {
    setExporting("csv");
    try {
      downloadCsv(reportTitle, RECEITA_SAUDE_CSV_HEADERS, table);
    } finally {
      setExporting(null);
    }
  }

  function exportCarnel() {
    if (!me) return;
    setExporting("carnel");
    try {
      const body = carnelLeaoCsv(rows, me, year);
      const blob = new Blob([`\uFEFF${body}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `carnel-leao-import-${month}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }

  async function emitBatch() {
    if (pendingReceipts.length === 0) return;
    setBatchBusy(true);
    try {
      const result = await issueFiscalReceiptBatch(pendingReceipts.map((item) => item.id));
      if (result.issued > 0) toast.success(`${result.issued} recibo(s) emitido(s).`);
      if (result.failed.length > 0) toast.warn(`${result.failed.length} lançamento(s) não puderam ser emitidos (verifique CPF na ficha).`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível emitir os recibos.");
    } finally {
      setBatchBusy(false);
    }
  }

  async function onCloseMonth() {
    setClosingBusy(true);
    try {
      await closeReceitaSaudeMonth(month);
      const saved = await getMonthClosing(month);
      setClosing(saved);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível fechar o mês.");
    } finally {
      setClosingBusy(false);
    }
  }

  if (loading) return <p className="text-muted">Carregando...</p>;

  return (
    <div>
      <PageTitle
        title="Central Receita Saúde"
        subtitle="Fechamento mensal, recibos, exportação e prévia do Carnê-Leão."
        action={
          <Link href="/admin/financeiro" className="btn-text">
            Voltar ao financeiro
          </Link>
        }
      />

      <Card className="mb-6 border-l-4 border-teal bg-paper">
        <h2 className="text-lg font-medium text-teal">Como usar com a Receita Federal</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink">
          <li>
            O recibo oficial é emitido no <strong>app Receita Federal</strong> ou no <strong>Carnê-Leão Web</strong>. O Psy Manager não envia dados automaticamente.
          </li>
          <li>Use este painel para conferir totais, emitir recibos PDF internos, exportar CSV e importar no Carnê-Leão quando aplicável.</li>
        </ul>
        {!fiscal.ok && (
          <p className="mt-4 text-sm text-accent">
            Complete CPF e CRP em{" "}
            <Link href="/admin/configuracoes" className="text-teal underline">
              Configurações
            </Link>{" "}
            ({fiscal.missing.join(", ")}).
          </p>
        )}
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MonthTotalCard
          title="Recebido no mês"
          month={month}
          value={summary.receivedTotal}
          previous={receitaSaudeMonthSummary(addMonths(month, -1), payments).receivedTotal}
          footnote={`${summary.paymentCount} pagamento(s) quitado(s)`}
        />
        <Card className="flex flex-col justify-center gap-1">
          <p className="text-sm text-muted">Recibos PDF emitidos</p>
          <p className="font-num text-2xl font-semibold text-teal">{summary.receiptsIssued}</p>
          <p className="text-xs text-muted">{summary.receiptsPending} pendente(s)</p>
        </Card>
        <Card className="flex flex-col justify-center gap-1">
          <p className="text-sm text-muted">Pacientes sem CPF</p>
          <p className="font-num text-2xl font-semibold text-teal">{missingCpf.length}</p>
          <p className="text-xs text-muted">Necessário para Receita Saúde</p>
        </Card>
        <Card className="flex flex-col justify-center gap-2">
          <p className="text-sm text-muted">Prévia Carnê-Leão (IR)</p>
          <p className="font-num text-2xl font-semibold text-teal">{formatMoney(taxEstimate.tax)}</p>
          <p className="text-xs leading-relaxed text-muted">{taxEstimate.disclaimer}</p>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-teal">Mês de referência</label>
            <input
              type="month"
              className="rounded-control border border-[var(--color-border-subtle)] px-3 py-2 text-sm"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-row" disabled={rows.length === 0 || exporting !== null} onClick={exportCsv}>
              {exporting === "csv" ? "Exportando..." : "CSV Receita Saúde"}
            </button>
            <button type="button" className="btn-row" disabled={rows.length === 0 || exporting !== null} onClick={() => void exportPdf()}>
              {exporting === "pdf" ? "Exportando..." : "PDF"}
            </button>
            <button
              type="button"
              className="btn-text"
              disabled={rows.length === 0 || !fiscal.ok || exporting !== null}
              onClick={exportCarnel}
            >
              {exporting === "carnel" ? "Exportando..." : "CSV Carnê-Leão"}
            </button>
            <button
              type="button"
              className="btn-row"
              disabled={pendingReceipts.length === 0 || batchBusy || !fiscal.ok}
              onClick={() => void emitBatch()}
            >
              {batchBusy ? "Emitindo..." : `Emitir ${pendingReceipts.length} recibo(s)`}
            </button>
            <button type="button" className="btn-text" disabled={closingBusy || summary.paymentCount === 0} onClick={() => void onCloseMonth()}>
              {closingBusy ? "Salvando..." : closing ? "Atualizar fechamento" : "Fechar mês"}
            </button>
          </div>
        </div>
        {closing ? (
          <p className="mt-4 text-sm text-muted">
            Fechado em {formatDate(closing.closedAt.slice(0, 10))} · {formatMoney(closing.summary.receivedTotal)} recebidos ·{" "}
            {closing.summary.receiptsIssued} recibo(s)
          </p>
        ) : null}
      </Card>

      {missingCpf.length > 0 ? (
        <Card className="mb-6">
          <h3 className="text-lg font-medium text-teal">Pacientes sem CPF no mês</h3>
          <ul className="mt-3 grid gap-2">
            {missingCpf.map((patient) => (
              <li key={patient.id}>
                <Link href={`/admin/pacientes/${patient.id}`} className="text-sm text-teal underline">
                  {patient.nome}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        {rows.length === 0 ? (
          <Empty>Nenhum pagamento recebido neste mês.</Empty>
        ) : (
          <>
            <MobileListGrid>
              {rows.map((row) => (
                <ListCard key={row.paymentId} title={row.patientNome} subtitle={`${formatDate(row.dataPagamento)} · ${formatMoney(row.valor)}`}>
                  <p className="mt-2 text-xs text-muted">Pagador: {row.cpfPagador ? maskCpf(row.cpfPagador) : "—"}</p>
                  <p className="text-xs text-muted">Beneficiário: {row.cpfBeneficiario ? maskCpf(row.cpfBeneficiario) : "—"}</p>
                </ListCard>
              ))}
            </MobileListGrid>
            <ResponsiveTableWrap>
              <table className="w-full min-w-0 text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)] text-teal">
                    {RECEITA_SAUDE_CSV_HEADERS.map((header) => (
                      <Th key={header}>{header}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.map((line, index) => (
                    <tr key={rows[index].paymentId} className="border-b border-[#eef2eb] hover:bg-paper">
                      {line.map((cell, cellIndex) => (
                        <Td key={cellIndex}>{cell}</Td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold text-teal">
                    <td className="px-3 py-2" colSpan={4}>
                      Total ({totals.count})
                    </td>
                    <td className="px-3 py-2">{formatMoney(totals.total)}</td>
                    <td className="px-3 py-2" />
                  </tr>
                </tfoot>
              </table>
            </ResponsiveTableWrap>
          </>
        )}
      </Card>
    </div>
  );
}
