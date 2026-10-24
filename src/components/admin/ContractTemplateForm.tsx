"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ContractEditor from "@/components/admin/ContractEditor";
import { Card, Field, PageTitle, fieldClass } from "@/components/admin/ui";
import { getContractTemplate, writeContractTemplate } from "@/lib/admin/collections";
import { DEFAULT_CONTRACT_TEMPLATE, type ContractTemplateVersion } from "@/lib/admin/contract";
import { formatDate } from "@/lib/admin/format";

function formatWhen(iso: string) {
  const date = formatDate(iso.slice(0, 10));
  const time = iso.includes("T") ? iso.slice(11, 16) : "";
  return time ? `${date} às ${time}` : date;
}

export default function ContractTemplateForm({ templateId }: { templateId?: string }) {
  const router = useRouter();
  const [nome, setNome] = useState("Modelo de contrato");
  const [conteudo, setConteudo] = useState(DEFAULT_CONTRACT_TEMPLATE);
  const [versao, setVersao] = useState(1);
  const [historico, setHistorico] = useState<ContractTemplateVersion[]>([]);
  const [loading, setLoading] = useState(Boolean(templateId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!templateId) return;
    let active = true;
    (async () => {
      try {
        const item = await getContractTemplate(templateId);
        if (!item) {
          toast.error("Modelo de contrato não encontrado.");
          router.replace("/admin/operacional/contrato");
          return;
        }
        if (!active) return;
        setNome(item.nome);
        setConteudo(item.conteudo);
        setVersao(item.versao);
        setHistorico([...item.historico].sort((a, b) => b.versao - a.versao));
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

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!nome.trim()) {
      toast.error("Informe um nome para o modelo.");
      return;
    }
    setSaving(true);
    try {
      const id = await writeContractTemplate({ nome, conteudo }, templateId);
      toast.success(templateId ? "Nova versão do modelo salva." : "Modelo de contrato salvo.");
      if (!templateId) router.replace(`/admin/operacional/contrato/${id}`);
      else {
        const item = await getContractTemplate(id);
        if (item) {
          setVersao(item.versao);
          setHistorico([...item.historico].sort((a, b) => b.versao - a.versao));
        }
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
        title={templateId ? "Editar modelo de contrato" : "Novo modelo de contrato"}
        subtitle={templateId ? `Versão atual ${versao}. Cada salvamento com alteração vira uma nova versão.` : "Dê um nome, monte o texto e salve. Depois você escolhe este modelo na ficha do paciente."}
        action={
          <Link href="/admin/operacional/contrato" className="btn-text">
            Voltar à lista
          </Link>
        }
      />
      <Card>
        <form onSubmit={onSave} className="grid gap-4">
          <Field label="Nome do modelo">
            <input className={fieldClass} value={nome} onChange={(event) => setNome(event.target.value)} required />
          </Field>
          <ContractEditor value={conteudo} onChange={setConteudo} />
          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" disabled={saving}>
              {saving ? "Salvando..." : templateId ? "Salvar nova versão" : "Salvar modelo"}
            </button>
            <button type="button" className="btn-text" disabled={saving} onClick={() => setConteudo(DEFAULT_CONTRACT_TEMPLATE)}>
              Restaurar modelo base
            </button>
          </div>
        </form>
      </Card>
      {historico.length > 0 && (
        <Card className="mt-6">
          <h2 className="text-xl font-medium text-teal">Histórico de versões</h2>
          <p className="mt-1 text-sm text-muted">Restaurar coloca o texto no editor. Salve para gravar como versão nova.</p>
          <ul className="mt-4 divide-y divide-[#eef2ee]">
            {historico.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-ink">
                    Versão {item.versao}
                    {item.versao === versao ? " · atual" : ""}
                  </p>
                  <p className="text-sm text-muted">
                    {formatWhen(item.quando)} · {item.resumo}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-chip"
                  onClick={() => {
                    setNome(item.nome);
                    setConteudo(item.conteudo);
                    toast.success(`Versão ${item.versao} carregada no editor.`);
                  }}
                >
                  Restaurar
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
