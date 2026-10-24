"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import MonthTotalCard from "@/components/admin/MonthTotalCard";
import { Card, Empty, MobileListGrid, PageTitle, ResponsiveTableWrap, Td, Th } from "@/components/admin/ui";
import ListCard from "@/components/admin/mobile/ListCard";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import { addMonths, formatDate, formatMoney, monthLabel, todayISO } from "@/lib/admin/format";
import { maskCpf } from "@/lib/masks";
import {
  RECEITA_SAUDE_CSV_HEADERS,
  carnelLeaoCsv,
  professionalFiscalReady,
  receitaSaudeCsvTable,
  receitaSaudeRows,
  receitaSaudeTotals,
} from "@/lib/admin/receita-saude-report";
import { createReportPdf, downloadCsv, downloadPdfBlob } from "@/lib/admin/reports";

export default function ReceitaSaudePage() {
  const { user } = useAuth();
  const { payments, patients, members, loading, patientName } = useClinic();
  const currentMonth = todayISO().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [exporting, setExporting] = useState<"csv" | "pdf" | "carnel" | null>(null);
  const me = members.find((member) => member.uid === user?.uid || member.email === user?.email?.toLowerCase());
  const fiscal = professionalFiscalReady(me);

  const rows = useMemo(
    () => (loading ? [] : receitaSaudeRows(month, payments, patients, patientName)),
    [loading, month, payments, patients, patientName]
  );
  const totals = receitaSaudeTotals(rows);
  const table = receitaSaudeCsvTable(rows);
  const reportTitle = `Receita Saúde — ${monthLabel(month)}`;

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
      const year = Number(month.slice(0, 4));
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

  if (loading) return <p className="text-muted">Carregando...</p>;

  return (
    <div>
      <PageTitle
        title="Receita Saúde / carnê-leão"
        subtitle="Relatório mensal dos pagamentos recebidos, com os campos usados no app Receita Saúde."
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
            O recibo oficial é emitido no <strong>app Receita Federal</strong> (perfil Profissional) ou no{" "}
            <strong>Carnê-Leão Web</strong> (e-CAC → Declarações → Carnê-Leão → Rendimentos → Receita Saúde). O Psy Manager não envia dados automaticamente à Receita — não há API pública.
          </li>
          <li>
            Para cada pagamento, informe: <strong>CPF do pagador</strong>, <strong>CPF do beneficiário</strong> (se for outra pessoa),{" "}
            <strong>valor</strong> e <strong>data do pagamento</strong> (manual Receita Saúde v2.1, pergunta 12).
          </li>
          <li>
            Use este relatório para copiar os dados ou exportar CSV. O arquivo de importação do Carnê-Leão segue o modelo do manual (lote, pergunta 24), quando seu cadastro no Carnê-Leão já estiver ativo.
          </li>
        </ul>
        {!fiscal.ok && (
          <p className="mt-4 text-sm text-accent">
            Complete CPF e CRP em{" "}
            <Link href="/admin/configuracoes" className="text-teal underline">
              Configurações
            </Link>{" "}
            para gerar recibos PDF e a planilha de importação ({fiscal.missing.join(", ")}).
          </p>
        )}
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <MonthTotalCard
          title="Pagamentos no mês"
          month={month}
          value={totals.total}
          previous={receitaSaudeTotals(receitaSaudeRows(addMonths(month, -1), payments, patients, patientName)).total}
          footnote={`${totals.count} ${totals.count === 1 ? "recebimento" : "recebimentos"} com status pago`}
        />
        <Card className="flex flex-col justify-center gap-3">
          <label className="text-sm font-medium text-teal">Mês de referência</label>
          <input
            type="month"
            className="rounded-md border border-[#d7e0d8] px-3 py-2 text-sm"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-row" disabled={rows.length === 0 || exporting !== null} onClick={exportCsv}>
              {exporting === "csv" ? "Exportando..." : "CSV"}
            </button>
            <button type="button" className="btn-row" disabled={rows.length === 0 || exporting !== null} onClick={() => void exportPdf()}>
              {exporting === "pdf" ? "Exportando..." : "PDF"}
            </button>
            <button
              type="button"
              className="btn-text"
              disabled={rows.length === 0 || !fiscal.ok || exporting !== null}
              onClick={exportCarnel}
              title="Formato de importação do Carnê-Leão Web (manual Receita Saúde)"
            >
              {exporting === "carnel" ? "Exportando..." : "CSV Carnê-Leão"}
            </button>
          </div>
        </Card>
      </div>

      <Card>
        {rows.length === 0 ? (
          <Empty>Nenhum pagamento recebido neste mês.</Empty>
        ) : (
          <>
            <div className="admin-mobile-only min-w-0" data-mobile-list>
              <MobileListGrid>
                {rows.map((row) => (
                  <ListCard
                    key={row.paymentId}
                    title={row.patientNome}
                    subtitle={`${formatDate(row.dataPagamento)} · ${formatMoney(row.valor)}`}
                  >
                    <p className="mt-2 text-xs text-muted">Pagador: {row.cpfPagador ? maskCpf(row.cpfPagador) : "—"}</p>
                    <p className="text-xs text-muted">Beneficiário: {row.cpfBeneficiario ? maskCpf(row.cpfBeneficiario) : "—"}</p>
                  </ListCard>
                ))}
              </MobileListGrid>
            </div>
            <ResponsiveTableWrap>
              <table className="w-full min-w-0 text-left text-sm">
                <thead>
                  <tr className="border-b border-[#d7e0d8] text-teal">
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
