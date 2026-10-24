"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { HiOutlineTrash, HiStar } from "react-icons/hi";
import Drawer from "@/components/admin/Drawer";
import ReportBuilder from "@/components/admin/ReportBuilder";
import ListCard from "@/components/admin/mobile/ListCard";
import { Card, DataTable, Empty, MobileListGrid, PageTitle, ResponsiveTableWrap, Td, Th } from "@/components/admin/ui";
import { uploadClinicFile } from "@/lib/admin/attachments";
import { useClinic } from "@/lib/admin/clinic-context";
import {
  createReportRun,
  listReportRuns,
  listReportTemplates,
  loadReportStore,
  removeReportRun,
  removeReportTemplate,
  saveReportTemplate,
} from "@/lib/admin/collections";
import { formatDate, todayISO } from "@/lib/admin/format";
import {
  cloneDefinition,
  clinicPdfHref,
  createReportPdf,
  defaultDefinition,
  describeReport,
  downloadPdfBlob,
  entityLabel,
  reportFileSlug,
  runReport,
  type ReportDefinition,
  type ReportResult,
  type ReportRun,
  type ReportStore,
  type ReportTemplate,
} from "@/lib/admin/reports";

const emptyStore: ReportStore = {
  patients: [],
  appointments: [],
  payments: [],
  expenses: [],
  packages: [],
  locations: [],
  members: [],
};

function defaultName(entity: ReportDefinition["entity"]) {
  return `Relatório de ${entityLabel(entity).toLowerCase()} — ${formatDate(todayISO())}`;
}

function formatWhen(iso: string) {
  const date = formatDate(iso.slice(0, 10));
  const time = iso.includes("T") ? iso.slice(11, 16) : "";
  return time ? `${date} às ${time}` : date;
}

export default function ReportsPage() {
  const clinic = useClinic();
  const lookups: ReportStore = {
    patients: clinic.patients,
    appointments: clinic.appointments,
    payments: clinic.payments,
    expenses: clinic.expenses,
    packages: clinic.packages,
    locations: clinic.locations,
    members: clinic.members,
  };
  const [favorites, setFavorites] = useState<ReportTemplate[]>([]);
  const [runs, setRuns] = useState<ReportRun[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(defaultName("patients"));
  const [definition, setDefinition] = useState<ReportDefinition>(defaultDefinition());
  const [favoriteId, setFavoriteId] = useState("");
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [preview, setPreview] = useState<ReportResult | null>(null);
  const [querying, setQuerying] = useState(false);
  const [generating, setGenerating] = useState(false);

  const refreshLists = useCallback(async () => {
    const [nextFavorites, nextRuns] = await Promise.all([listReportTemplates(), listReportRuns()]);
    setFavorites(nextFavorites);
    setRuns(nextRuns);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await refreshLists();
      } catch (error) {
        console.error(error);
        if (active) toast.error("Não foi possível carregar os relatórios.");
      } finally {
        if (active) setLoadingLists(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshLists]);

  function openNew() {
    const next = defaultDefinition();
    setDefinition(next);
    setNome(defaultName(next.entity));
    setFavoriteId("");
    setPreview(null);
    setOpen(true);
  }

  function openFavorite(template: ReportTemplate) {
    setDefinition(cloneDefinition(template.definition));
    setNome(template.nome);
    setFavoriteId(template.id);
    setPreview(null);
    setOpen(true);
  }

  function openRun(run: ReportRun) {
    setDefinition(cloneDefinition(run.definition));
    setNome(run.nome);
    setFavoriteId(favorites.find((item) => item.nome === run.nome)?.id ?? "");
    setPreview(null);
    setOpen(true);
  }

  async function toggleFavorite() {
    const label = nome.trim();
    if (!label) {
      toast.error("Informe um nome para favoritar este modelo.");
      return;
    }
    setFavoriteBusy(true);
    try {
      if (favoriteId) {
        await removeReportTemplate(favoriteId);
        setFavoriteId("");
        toast.success("Modelo removido dos favoritos.");
      } else {
        const id = await saveReportTemplate(label, definition);
        setFavoriteId(id);
        toast.success("Modelo favoritado. Você pode gerar de novo a qualquer momento.");
      }
      await refreshLists();
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível atualizar o favorito.");
    } finally {
      setFavoriteBusy(false);
    }
  }

  async function executeQuery() {
    setQuerying(true);
    try {
      const store = await loadReportStore();
      setPreview(runReport(definition, store));
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível executar a consulta.");
    } finally {
      setQuerying(false);
    }
  }

  async function generateReport() {
    const label = nome.trim();
    if (!label) {
      toast.error("Informe um nome para o relatório.");
      return;
    }
    setGenerating(true);
    try {
      const store = await loadReportStore();
      const result = runReport(definition, store);
      const generatedAt = `${formatDate(todayISO())} às ${new Date().toTimeString().slice(0, 5)}`;
      const blob = await createReportPdf({
        nome: label,
        description: describeReport(definition),
        generatedAt,
        headers: result.headers,
        table: result.table,
      });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const file = new File([bytes], `${reportFileSlug(label)}.pdf`, { type: "application/pdf" });
      downloadPdfBlob(file, label);
      const pdf = await uploadClinicFile(file, "relatorios", "documento");
      await createReportRun({ nome: label, definition, rowCount: result.count, pdf });
      if (favoriteId) await saveReportTemplate(label, definition, favoriteId);
      toast.success("Relatório gerado. O PDF foi baixado e ficou na listagem.");
      setPreview(result);
      setOpen(false);
      await refreshLists();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o relatório.");
    } finally {
      setGenerating(false);
    }
  }

  async function removeFavorite(id: string) {
    if (!window.confirm("Remover este modelo dos favoritos?")) return;
    try {
      await removeReportTemplate(id);
      if (favoriteId === id) setFavoriteId("");
      toast.success("Favorito removido.");
      await refreshLists();
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível remover o favorito.");
    }
  }

  async function removeRun(id: string) {
    if (!window.confirm("Excluir este relatório gerado?")) return;
    try {
      await removeReportRun(id);
      toast.success("Relatório excluído.");
      await refreshLists();
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível excluir o relatório.");
    }
  }

  return (
    <div>
      <PageTitle
        title="Relatórios"
        subtitle="Gere um PDF com a consulta montada, favorize os filtros para repetir depois e baixe os relatórios já emitidos."
        action={
          <button type="button" className="btn-primary" onClick={openNew}>
            Criar novo relatório
          </button>
        }
      />

      {favorites.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-xl font-medium text-teal">Modelos favoritos</h2>
          <p className="mt-1 text-sm text-muted">Filtros e colunas salvos para gerar o mesmo relatório de novo.</p>
          <ul className="mt-4 divide-y divide-[#eef2ee]">
            {favorites.map((template) => (
              <li key={template.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium text-ink">
                    <HiStar className="shrink-0 text-accent" size={16} />
                    {template.nome}
                  </p>
                  <p className="text-sm text-muted">{describeReport(template.definition)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className="btn-chip" onClick={() => openFavorite(template)}>
                    Abrir
                  </button>
                  <button type="button" className="btn-text text-accent" onClick={() => removeFavorite(template.id)} aria-label={`Remover ${template.nome}`}>
                    <HiOutlineTrash size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-medium text-teal">Relatórios gerados</h2>
        <p className="mt-1 text-sm text-muted">Cada geração busca os dados na hora e guarda o PDF para download.</p>
        <div className="mt-4">
          {loadingLists ? (
            <p className="text-muted">Carregando relatórios...</p>
          ) : runs.length === 0 ? (
            <Empty>Nenhum relatório gerado ainda. Crie um novo e clique em Gerar relatório.</Empty>
          ) : (
            <>
            <MobileListGrid>
              {runs.map((run) => (
                <ListCard
                  key={run.id}
                  onClick={() => openRun(run)}
                  title={run.nome}
                  subtitle={`${entityLabel(run.definition.entity)} · ${formatWhen(run.createdAt)} · ${run.rowCount} registros`}
                />
              ))}
            </MobileListGrid>
            <ResponsiveTableWrap>
            <DataTable minWidth={760}>
              <thead>
                <tr>
                  <Th>Relatório</Th>
                  <Th>Entidade</Th>
                  <Th>Gerado em</Th>
                  <Th>Registros</Th>
                  <Th>PDF</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id}>
                    <Td>
                      <button type="button" className="text-left font-medium text-teal" onClick={() => openRun(run)}>
                        {run.nome}
                      </button>
                    </Td>
                    <Td>{entityLabel(run.definition.entity)}</Td>
                    <Td>{formatWhen(run.createdAt)}</Td>
                    <Td>{run.rowCount}</Td>
                    <Td>
                      {run.pdf?.url ? (
                        <a
                          href={clinicPdfHref(run.pdf.url, run.pdf.nome || run.nome)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-teal"
                        >
                          Baixar PDF
                        </a>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>
                      <button type="button" className="btn-text text-accent" onClick={() => removeRun(run.id)} aria-label={`Excluir ${run.nome}`}>
                        <HiOutlineTrash size={18} />
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            </ResponsiveTableWrap>
            </>
          )}
        </div>
      </Card>

      <Drawer
        open={open}
        title={favoriteId ? "Modelo favorito" : "Novo relatório"}
        onClose={() => setOpen(false)}
        size="wide"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" className="btn-text flex-1" disabled={querying || generating} onClick={executeQuery}>
              {querying ? "Consultando..." : "Executar consulta direta"}
            </button>
            <button type="button" className="btn-primary flex-1" disabled={querying || generating} onClick={generateReport}>
              {generating ? "Gerando..." : "Gerar relatório"}
            </button>
          </div>
        }
      >
        <ReportBuilder
          lookups={clinic.loading ? emptyStore : lookups}
          nome={nome}
          onNome={setNome}
          definition={definition}
          onDefinition={setDefinition}
          favoriteId={favoriteId}
          onToggleFavorite={toggleFavorite}
          favoriteBusy={favoriteBusy}
          preview={preview}
        />
      </Drawer>
    </div>
  );
}
