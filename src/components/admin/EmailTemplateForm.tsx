"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Card, Field, PageTitle, fieldClass } from "@/components/admin/ui";
import Select from "@/components/admin/Select";
import { getEmailTemplate, listEmailLogForTemplate, writeEmailTemplate } from "@/lib/admin/collections";
import { formatDate } from "@/lib/admin/format";
import { EMAIL_TEMPLATE_VARIABLES } from "@/lib/email-integration/templates";
import type { EmailAttachmentKind, EmailLogEntry, EmailTemplateTrigger } from "@/lib/email-integration/types";

const TRIGGER_OPTIONS: { value: EmailTemplateTrigger; label: string }[] = [
  { value: "confirmacao_pagamento", label: "Confirmação de pagamento" },
  { value: "cobranca_pix", label: "Cobrança com Pix" },
  { value: "copia_contrato", label: "Cópia do contrato" },
  { value: "envio_recibo", label: "Envio de recibo" },
  { value: "lembrete_sessao", label: "Lembrete de sessão" },
  { value: "link_avaliacao", label: "Link de avaliação" },
  { value: "livre", label: "Livre / manual" },
];

const ANEXO_OPTIONS: { value: EmailAttachmentKind; label: string }[] = [
  { value: "nenhum", label: "Nenhum" },
  { value: "contrato", label: "PDF do contrato" },
  { value: "recibo", label: "PDF do recibo" },
];

function formatWhen(iso: string) {
  const date = formatDate(iso.slice(0, 10));
  const time = iso.includes("T") ? iso.slice(11, 16) : "";
  return time ? `${date} às ${time}` : date;
}

export default function EmailTemplateForm({ templateId }: { templateId?: string }) {
  const router = useRouter();
  const [nome, setNome] = useState("Modelo de e-mail");
  const [trigger, setTrigger] = useState<EmailTemplateTrigger>("livre");
  const [assunto, setAssunto] = useState("");
  const [corpo, setCorpo] = useState("");
  const [anexo, setAnexo] = useState<EmailAttachmentKind>("nenhum");
  const [autoSend, setAutoSend] = useState(false);
  const [versao, setVersao] = useState(1);
  const [historico, setHistorico] = useState<{ id: string; versao: number; quando: string; resumo: string }[]>([]);
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState(Boolean(templateId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!templateId) return;
    let active = true;
    (async () => {
      try {
        const item = await getEmailTemplate(templateId);
        if (!item) {
          toast.error("Modelo de e-mail não encontrado.");
          router.replace("/admin/operacional/email");
          return;
        }
        if (!active) return;
        setNome(item.nome);
        setTrigger(item.trigger);
        setAssunto(item.assunto);
        setCorpo(item.corpo);
        setAnexo(item.anexo);
        setAutoSend(item.autoSend);
        setVersao(item.versao);
        setHistorico([...item.historico].sort((a, b) => b.versao - a.versao));
        setLogs(await listEmailLogForTemplate(templateId));
      } catch (error) {
        console.error(error);
        toast.error("Não foi possível carregar o modelo.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [router, templateId]);

  function insertVariable(key: string) {
    setCorpo((current) => `${current}{{${key}}}`);
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!nome.trim() || !assunto.trim() || !corpo.trim()) {
      toast.error("Preencha nome, assunto e corpo.");
      return;
    }
    setSaving(true);
    try {
      const id = await writeEmailTemplate({ nome, trigger, assunto, corpo, anexo, autoSend }, templateId);
      toast.success(templateId ? "Nova versão do modelo salva." : "Modelo de e-mail salvo.");
      if (!templateId) router.replace(`/admin/operacional/email/${id}`);
      else {
        const item = await getEmailTemplate(id);
        if (item) {
          setVersao(item.versao);
          setHistorico([...item.historico].sort((a, b) => b.versao - a.versao));
        }
        setLogs(await listEmailLogForTemplate(id));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o modelo.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted">Carregando modelo...</p>;

  return (
    <div>
      <PageTitle
        title={templateId ? "Editar modelo de e-mail" : "Novo modelo de e-mail"}
        subtitle="Use variáveis como {{paciente_nome}}. O envio automático só vale para confirmação de pagamento e começa desligado."
        action={
          <Link href="/admin/operacional/email" className="btn-text">
            Voltar à lista
          </Link>
        }
      />
      <Card>
        <form onSubmit={onSave} className="grid gap-4">
          <Field label="Nome do modelo">
            <input className={fieldClass} value={nome} onChange={(event) => setNome(event.target.value)} required />
          </Field>
          <Field label="Tipo / gatilho">
            <Select value={trigger} onChange={(value) => setTrigger(value as EmailTemplateTrigger)} options={TRIGGER_OPTIONS} />
          </Field>
          <Field label="Assunto">
            <input className={fieldClass} value={assunto} onChange={(event) => setAssunto(event.target.value)} required />
          </Field>
          <Field label="Anexo sugerido">
            <Select value={anexo} onChange={(value) => setAnexo(value as EmailAttachmentKind)} options={ANEXO_OPTIONS} />
          </Field>
          {trigger === "confirmacao_pagamento" ? (
            <label className="flex items-start gap-2 text-sm text-ink">
              <input type="checkbox" checked={autoSend} onChange={(event) => setAutoSend(event.target.checked)} className="mt-1" />
              <span>
                Enviar automaticamente quando um pagamento ficar <strong>pago</strong> (uma vez por lançamento).
              </span>
            </label>
          ) : null}
          <Field label="Corpo (texto com **negrito** e quebras de linha)">
            <textarea className={`${fieldClass} min-h-[200px] font-mono text-sm`} value={corpo} onChange={(event) => setCorpo(event.target.value)} required />
          </Field>
          <div>
            <p className="text-sm font-medium text-ink">Inserir variável</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {EMAIL_TEMPLATE_VARIABLES.map((item) => (
                <button key={item.key} type="button" className="btn-chip text-xs" onClick={() => insertVariable(item.key)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" disabled={saving}>
              {saving ? "Salvando..." : templateId ? "Salvar nova versão" : "Salvar modelo"}
            </button>
          </div>
        </form>
      </Card>
      {historico.length > 0 && (
        <Card className="mt-6">
          <h2 className="text-xl font-medium text-teal">Histórico de versões</h2>
          <ul className="mt-4 divide-y divide-[#eef2ee]">
            {historico.map((item) => (
              <li key={item.id} className="py-3 text-sm text-ink">
                <span className="font-medium">v{item.versao}</span>
                {item.versao === versao ? " · atual" : ""} — {formatWhen(item.quando)} — {item.resumo}
              </li>
            ))}
          </ul>
        </Card>
      )}
      {templateId && logs.length > 0 && (
        <Card className="mt-6">
          <h2 className="text-xl font-medium text-teal">Histórico de envios</h2>
          <ul className="mt-4 divide-y divide-[#eef2ee]">
            {logs.map((item) => (
              <li key={item.id} className="py-3 text-sm">
                <p className="font-medium text-ink">{item.subject}</p>
                <p className="text-muted">
                  Para {item.to} · {formatWhen(item.sentAt)} · {item.status === "enviado" ? "Enviado" : "Erro"}
                </p>
                {item.error ? <p className="text-accent text-xs">{item.error}</p> : null}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
