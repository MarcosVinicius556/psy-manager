"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import Drawer from "@/components/admin/Drawer";
import Select from "@/components/admin/Select";
import { Card, DataTable, Empty, PageTitle, Field, Pill, Td, Th, fieldClass } from "@/components/admin/ui";
import { useClinic } from "@/lib/admin/clinic-context";
import { formatDate, formatMoney, labelAppointmentStatus } from "@/lib/admin/format";
import { PACKAGE_TYPES, SINGLE_SESSION_PACKAGE_MESSAGE, packageIntervalDays, packageTypeLabel } from "@/lib/admin/packages";
import type { Appointment, PackageType, SessionPackage } from "@/lib/admin/types";

function packageAppointments(appointments: Appointment[], packageId: string) {
  return appointments
    .filter((item) => item.packageId === packageId && item.status !== "cancelado")
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
}

function isFinished(item: Appointment) {
  return item.status === "concluido";
}

function isUpcoming(item: Appointment) {
  return item.status === "agendado" || item.status === "em_andamento";
}

export default function PackagesPage() {
  const { packages, appointments, loading, savePackage, archivePackage, patientName } = useClinic();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SessionPackage | null>(null);
  const [viewing, setViewing] = useState<SessionPackage | null>(null);
  const [sessionView, setSessionView] = useState<{ patientId: string; kind: "realizados" | "futuros" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "arquivados" | PackageType>("todos");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return packages.filter((item) => {
      if (filtro === "arquivados") {
        if (!item.arquivado) return false;
      } else if (item.arquivado) {
        return false;
      } else if (filtro !== "todos" && item.tipo !== filtro) {
        return false;
      }
      if (!term) return true;
      return item.nome.toLowerCase().includes(term) || item.observacoes.toLowerCase().includes(term);
    });
  }, [filtro, packages, query]);
  const [form, setForm] = useState({
    nome: "",
    tipo: "quinzenal" as PackageType,
    valorSessao: "",
    sessoes: "2",
    observacoes: "",
  });
  const sessionCount = Math.floor(Number(form.sessoes) || 0);
  const singleSession = sessionCount === 1;

  function openNew() {
    setEditing(null);
    setForm({ nome: "", tipo: "quinzenal", valorSessao: "", sessoes: "2", observacoes: "" });
    setOpen(true);
  }

  function openEdit(item: SessionPackage) {
    setEditing(item);
    setForm({
      nome: item.nome,
      tipo: item.tipo,
      valorSessao: String(item.valorSessao).replace(".", ","),
      sessoes: String(item.sessoes || 1),
      observacoes: item.observacoes,
    });
    setOpen(true);
  }

  async function toggleArchive(item: SessionPackage) {
    try {
      await archivePackage(item.id, !item.arquivado);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível arquivar o pacote.");
    }
  }

  function changeType(next: PackageType) {
    const preset = PACKAGE_TYPES.find((item) => item.value === next)?.sessoes;
    setForm({ ...form, tipo: next, sessoes: preset ? String(preset) : form.sessoes });
  }

  function changeSessions(raw: string) {
    const digits = raw.replace(/\D/g, "");
    const count = Math.floor(Number(digits) || 0);
    const preset = PACKAGE_TYPES.find((item) => item.value === form.tipo)?.sessoes;
    const tipo = preset && digits !== "" && count !== preset ? "personalizado" : form.tipo;
    setForm({ ...form, sessoes: digits, tipo });
  }

  function requestClose() {
    if (singleSession) {
      toast.error(SINGLE_SESSION_PACKAGE_MESSAGE);
      return;
    }
    setOpen(false);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (singleSession) {
      toast.error(SINGLE_SESSION_PACKAGE_MESSAGE);
      return;
    }
    setSaving(true);
    try {
      await savePackage(
        {
          nome: form.nome,
          tipo: form.tipo,
          valorSessao: Number(form.valorSessao.replace(",", ".")) || 0,
          sessoes: Math.floor(Number(form.sessoes) || 0),
          observacoes: form.observacoes,
        },
        editing?.id
      );
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cadastrar o pacote.");
    } finally {
      setSaving(false);
    }
  }

  const viewingSessions = viewing ? packageAppointments(appointments, viewing.id) : [];
  const patientsOnPackage = useMemo(() => {
    if (!viewing) return [];
    const grouped = new Map<string, Appointment[]>();
    for (const item of viewingSessions) {
      const list = grouped.get(item.patientId) ?? [];
      list.push(item);
      grouped.set(item.patientId, list);
    }
    const quota = Math.max(1, viewing.sessoes);
    return [...grouped.entries()]
      .map(([patientId, sessions]) => {
        const realizados = sessions.filter(isFinished);
        const futuros = sessions.filter(isUpcoming);
        const done = realizados.length;
        return {
          patientId,
          sessions,
          realizados,
          futuros,
          done,
          remaining: Math.max(0, quota - done),
        };
      })
      .sort((a, b) => patientName(a.patientId).localeCompare(patientName(b.patientId), "pt-BR"));
  }, [patientName, viewing, viewingSessions]);

  if (loading) return <p className="text-muted">Carregando pacotes...</p>;

  return (
    <div>
      <PageTitle
        title="Pacotes"
        subtitle="Modelos do profissional. Arquivar tira o pacote dos novos atendimentos e mantém o histórico."
        action={
          <button type="button" className="btn-primary" onClick={openNew}>
            Novo pacote
          </button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["todos", "Todos"],
            ["arquivados", "Arquivados"],
            ...PACKAGE_TYPES.map((item) => [item.value, item.label] as const),
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFiltro(value)}
            className={filtro === value ? "btn-chip-active" : "btn-chip"}
          >
            {label}
          </button>
        ))}
      </div>
      <Card>
        <div className="mb-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome ou observação"
            className={fieldClass}
          />
        </div>
        {filtered.length === 0 ? (
          <Empty>
            {packages.length === 0
              ? "Nenhum pacote cadastrado."
              : filtro === "arquivados"
                ? "Nenhum pacote arquivado."
                : "Nenhum pacote neste filtro."}
          </Empty>
        ) : (
          <DataTable>
            <thead>
              <tr>
                <Th>Pacote</Th>
                <Th>Tipo</Th>
                <Th>Sessões</Th>
                <Th>Valor da sessão</Th>
                <Th>Pacientes</Th>
                <Th className="text-center">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const patientIds = new Set(
                  packageAppointments(appointments, item.id).map((appointment) => appointment.patientId)
                );
                return (
                  <tr key={item.id} className="hover:bg-paper">
                    <Td>
                      <p className="flex flex-wrap items-center gap-2 font-medium text-teal">
                        {item.nome}
                        {item.arquivado && <Pill tone="muted">Arquivado</Pill>}
                      </p>
                      {item.observacoes && <p className="mt-1 text-xs text-muted">{item.observacoes}</p>}
                    </Td>
                    <Td>{packageTypeLabel(item.tipo)}</Td>
                    <Td>
                      {item.sessoes} em {packageIntervalDays(item.tipo)} dias
                    </Td>
                    <Td>{formatMoney(item.valorSessao)}</Td>
                    <Td>
                      {patientIds.size === 0 ? (
                        "—"
                      ) : (
                        <span className="font-num">
                          {patientIds.size} {patientIds.size === 1 ? "paciente" : "pacientes"}
                        </span>
                      )}
                    </Td>
                    <Td className="text-right">
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          type="button"
                          className="btn-row"
                          disabled={patientIds.size === 0}
                          onClick={() => {
                            setSessionView(null);
                            setViewing(item);
                          }}
                        >
                          Pacientes
                        </button>
                        <button type="button" className="btn-row" onClick={() => openEdit(item)}>
                          Editar
                        </button>
                        <button type="button" className="btn-text" onClick={() => toggleArchive(item)}>
                          {item.arquivado ? "Reativar" : "Arquivar"}
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </DataTable>
        )}
      </Card>
      <Drawer
        open={Boolean(viewing)}
        title={viewing ? `Pacientes · ${viewing.nome}` : "Pacientes"}
        onClose={() => {
          setViewing(null);
          setSessionView(null);
        }}
      >
        {viewing && (
          <div className="grid gap-4">
            <p className="text-sm text-muted">
              {viewing.sessoes} {viewing.sessoes === 1 ? "sessão" : "sessões"} neste pacote. Realizados contam só os atendimentos concluídos. O que falta é o que ainda não foi feito para fechar essa quantidade.
            </p>
            {patientsOnPackage.length === 0 ? (
              <Empty>Nenhum paciente está usando este pacote.</Empty>
            ) : (
              patientsOnPackage.map((row) => {
                const openKind =
                  sessionView?.patientId === row.patientId ? sessionView.kind : null;
                const shown = openKind === "realizados" ? row.realizados : openKind === "futuros" ? row.futuros : [];
                return (
                  <div key={row.patientId} className="rounded-md bg-paper p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link href={`/admin/pacientes/${row.patientId}`} className="font-medium text-teal">
                          {patientName(row.patientId)}
                        </Link>
                        <p className="mt-2 font-num text-sm text-muted">
                          {row.done} {row.done === 1 ? "realizado" : "realizados"}
                          {" · "}
                          {row.futuros.length} {row.futuros.length === 1 ? "futuro" : "futuros"}
                          {" · "}
                          {row.remaining} {row.remaining === 1 ? "sessão faltando" : "sessões faltando"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={openKind === "realizados" ? "btn-chip-active" : "btn-chip"}
                          onClick={() =>
                            setSessionView(
                              openKind === "realizados" ? null : { patientId: row.patientId, kind: "realizados" }
                            )
                          }
                        >
                          Realizados
                        </button>
                        <button
                          type="button"
                          className={openKind === "futuros" ? "btn-chip-active" : "btn-chip"}
                          onClick={() =>
                            setSessionView(openKind === "futuros" ? null : { patientId: row.patientId, kind: "futuros" })
                          }
                        >
                          Futuros
                        </button>
                      </div>
                    </div>
                    {openKind && (
                      <div className="mt-3">
                        {shown.length === 0 ? (
                          <Empty>
                            {openKind === "realizados"
                              ? "Nenhum atendimento realizado neste pacote."
                              : "Nenhum atendimento futuro neste pacote."}
                          </Empty>
                        ) : (
                          <div className="grid gap-1">
                            {shown.map((appointment) => (
                              <Link
                                key={appointment.id}
                                href={`/admin/atendimentos/${appointment.id}`}
                                className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm"
                              >
                                <span className="font-medium">
                                  {formatDate(appointment.date)} · {appointment.startTime}
                                  {appointment.packageVersao ? ` · v${appointment.packageVersao}` : ""}
                                </span>
                                <span className="text-xs text-muted">{labelAppointmentStatus(appointment.status)}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </Drawer>
      <Drawer open={open} title={editing ? "Editar pacote" : "Novo pacote"} onClose={requestClose}>
        <form onSubmit={onSubmit} className="grid gap-4">
          <Field label="Nome do pacote">
            <input
              className={fieldClass}
              value={form.nome}
              onChange={(event) => setForm({ ...form, nome: event.target.value })}
              placeholder="Acompanhamento quinzenal"
              required
            />
          </Field>
          {editing?.tipo === "semanal" && form.tipo === "semanal" && (
            <p className="rounded-md bg-[#f6e6df] px-4 py-3 text-sm text-accent">
              Este pacote está como semanal. Escolha quinzenal ou mensal para salvar.
            </p>
          )}
          <Field label="Tipo">
            <Select
              value={form.tipo === "semanal" ? "" : form.tipo}
              onChange={(next) => changeType(next as PackageType)}
              options={PACKAGE_TYPES.map((item) => ({
                value: item.value,
                label: item.sessoes ? `${item.label} · ${item.sessoes} sessões` : item.label,
              }))}
            />
          </Field>
          <Field label="Quantidade de sessões">
            <input
              className={fieldClass}
              inputMode="numeric"
              min={2}
              max={30}
              value={form.sessoes}
              onChange={(event) => changeSessions(event.target.value)}
              required
            />
          </Field>
          {singleSession && (
            <p className="rounded-md bg-[#f6e6df] px-4 py-3 text-sm text-accent">{SINGLE_SESSION_PACKAGE_MESSAGE}</p>
          )}
          <Field label="Valor de cada atendimento">
            <input
              className={fieldClass}
              inputMode="decimal"
              value={form.valorSessao}
              onChange={(event) => setForm({ ...form, valorSessao: event.target.value })}
              placeholder="0,00"
              required
            />
          </Field>
          <Field label="Observações">
            <textarea
              className={`${fieldClass} min-h-24`}
              value={form.observacoes}
              onChange={(event) => setForm({ ...form, observacoes: event.target.value })}
            />
          </Field>
          <p className="rounded-md bg-paper px-4 py-3 text-sm text-muted">
            Quinzenal usa 2 sessões em 15 dias e mensal usa 4 sessões em 30 dias. Outra quantidade vira Personalizado
            {form.tipo === "personalizado" ? `, com as sessões distribuídas em ${packageIntervalDays("personalizado")} dias` : ""}. {Math.max(sessionCount, 0) || "—"} {sessionCount === 1 ? "sessão" : "sessões"} a partir da data marcada.
            {form.valorSessao ? ` Cada sessão fica em ${formatMoney(Number(form.valorSessao.replace(",", ".")) || 0)}.` : ""} Alterar o pacote cria uma nova versão. Atendimentos já marcados continuam com a versão anterior. Arquivar retira o pacote dos novos atendimentos sem apagar o histórico.
          </p>
          {editing && editing.historico.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Auditoria</p>
              <div className="grid max-h-48 gap-2 overflow-y-auto">
                {[...editing.historico].reverse().map((entry) => (
                  <div key={entry.id} className="rounded-md bg-paper px-3 py-2 text-sm">
                    <p className="font-medium">Versão {entry.versao} · {formatDate(entry.quando.slice(0, 10))}</p>
                    <p className="text-muted">{entry.resumo}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button className="btn-primary justify-self-start" disabled={saving}>
            {saving ? "Salvando..." : editing ? "Salvar nova versão" : "Cadastrar pacote"}
          </button>
        </form>
      </Drawer>
    </div>
  );
}
