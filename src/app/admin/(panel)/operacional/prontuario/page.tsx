"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import Select from "@/components/admin/Select";
import { Card, Empty, Field, PageTitle, fieldClass } from "@/components/admin/ui";
import { CLINICAL_APPROACH_LABELS } from "@/lib/admin/clinical-note-templates";
import { listClinicalNoteTemplates, removeClinicalNoteTemplate, writeClinicalNoteTemplate } from "@/lib/admin/collections";
import type { ClinicalApproachId, ClinicalNoteTemplate, ClinicalTemplateSectionDef } from "@/lib/admin/types";

function emptySection(): ClinicalTemplateSectionDef {
  return { key: `sec_${crypto.randomUUID().slice(0, 8)}`, label: "Nova seção" };
}

export default function ClinicalTemplatesPage() {
  const [templates, setTemplates] = useState<ClinicalNoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [approach, setApproach] = useState<ClinicalApproachId>("custom");
  const [sections, setSections] = useState<ClinicalTemplateSectionDef[]>([emptySection()]);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setTemplates(await listClinicalNoteTemplates());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function startNew() {
    setEditingId(null);
    setNome("");
    setApproach("custom");
    setSections([emptySection()]);
  }

  function startEdit(template: ClinicalNoteTemplate) {
    setEditingId(template.id);
    setNome(template.nome);
    setApproach(template.approach);
    setSections(template.sections.length ? template.sections : [emptySection()]);
  }

  async function save() {
    setSaving(true);
    try {
      const id = await writeClinicalNoteTemplate({ nome, approach, sections }, editingId ?? undefined);
      toast.success(editingId ? "Modelo atualizado." : "Modelo criado.");
      setEditingId(id);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o modelo.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await removeClinicalNoteTemplate(id);
      toast.success("Modelo removido.");
      if (editingId === id) startNew();
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover o modelo.");
    }
  }

  return (
    <div>
      <PageTitle
        title="Modelos de prontuário"
        subtitle="Modelos personalizados por abordagem. Os modelos padrão (TCC, Psicanálise, etc.) já vêm no sistema."
        action={
          <button type="button" className="btn-primary min-h-11" onClick={startNew}>
            Novo modelo
          </button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Card>
          <h2 className="mb-4 text-xl font-medium text-teal">Seus modelos</h2>
          {loading ? (
            <p className="text-sm text-muted">Carregando...</p>
          ) : templates.length === 0 ? (
            <Empty>Nenhum modelo personalizado. Use modelos integrados ao registrar evolução ou crie o seu aqui.</Empty>
          ) : (
            <ul className="space-y-2">
              {templates.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#e7eee8] p-3">
                  <div>
                    <p className="font-medium text-ink">{item.nome}</p>
                    <p className="text-sm text-muted">{CLINICAL_APPROACH_LABELS[item.approach]} · {item.sections.length} seções</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-row min-h-11" onClick={() => startEdit(item)}>
                      Editar
                    </button>
                    <button type="button" className="btn-text min-h-11" onClick={() => void remove(item.id)}>
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-sm text-muted">
            <Link href="/admin/operacional/consentimento" className="text-teal">
              Modelo de TCLE
            </Link>
          </p>
        </Card>
        <Card>
          <h2 className="mb-4 text-xl font-medium text-teal">{editingId ? "Editar modelo" : "Novo modelo"}</h2>
          <div className="grid gap-4">
            <Field label="Nome">
              <input className={fieldClass} value={nome} onChange={(event) => setNome(event.target.value)} />
            </Field>
            <Field label="Abordagem">
              <Select
                value={approach}
                onChange={(value) => setApproach(value as ClinicalApproachId)}
                options={Object.entries(CLINICAL_APPROACH_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium">Seções</p>
              <div className="grid gap-3">
                {sections.map((section, index) => (
                  <div key={section.key} className="grid gap-2 rounded-md bg-paper p-3 sm:grid-cols-2">
                    <input
                      className={fieldClass}
                      placeholder="Título da seção"
                      value={section.label}
                      onChange={(event) =>
                        setSections((current) =>
                          current.map((item, i) => (i === index ? { ...item, label: event.target.value } : item))
                        )
                      }
                    />
                    <input
                      className={fieldClass}
                      placeholder="Chave interna"
                      value={section.key}
                      onChange={(event) =>
                        setSections((current) =>
                          current.map((item, i) => (i === index ? { ...item, key: event.target.value } : item))
                        )
                      }
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn-text mt-2 min-h-11"
                onClick={() => setSections((current) => [...current, emptySection()])}
              >
                Adicionar seção
              </button>
            </div>
            <button type="button" className="btn-primary min-h-11" disabled={saving} onClick={() => void save()}>
              {saving ? "Salvando..." : "Salvar modelo"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
