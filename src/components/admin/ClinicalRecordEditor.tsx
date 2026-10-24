"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Select from "@/components/admin/Select";
import { Field, fieldClass } from "@/components/admin/ui";
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect";
import {
  applySectionsToClinicalRecord,
  CLINICAL_APPROACH_LABELS,
  defaultTemplateForApproach,
  hydrateSectionsFromClinical,
  mergeClinicalTemplates,
  resolveClinicalTemplate,
} from "@/lib/admin/clinical-note-templates";
import { listClinicalNoteTemplates } from "@/lib/admin/collections";
import { MOODS, labelMood } from "@/lib/admin/format";
import { useClinic } from "@/lib/admin/clinic-context";
import {
  emptyClinical,
  type Appointment,
  type ClinicalApproachId,
  type ClinicalNoteTemplate,
  type ClinicalRecord,
  type Mood,
} from "@/lib/admin/types";
import FileAttachments from "./FileAttachments";

function formatSavedAt(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ClinicalRecordEditor({
  appointment,
  compact,
  autosave = true,
  onClinicalChange,
}: {
  appointment: Appointment;
  compact?: boolean;
  autosave?: boolean;
  onClinicalChange?: (clinical: ClinicalRecord) => void;
}) {
  const { saveClinical } = useClinic();
  const [customTemplates, setCustomTemplates] = useState<ClinicalNoteTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [clinical, setClinical] = useState<ClinicalRecord>(() => ({
    ...emptyClinical(),
    ...appointment.clinical,
    anamneseArquivos: appointment.clinical.anamneseArquivos ?? [],
    atividadesArquivos: appointment.clinical.atividadesArquivos ?? [],
  }));
  const [templateId, setTemplateId] = useState(
    () => appointment.clinical.templateId || defaultTemplateForApproach(appointment.clinical.approach || "tcc").id
  );
  const [sectionDraft, setSectionDraft] = useState<Record<string, string>>(() => {
    const initialTemplate = resolveClinicalTemplate(
      appointment.clinical.templateId || defaultTemplateForApproach(appointment.clinical.approach || "tcc").id,
      []
    );
    return initialTemplate ? hydrateSectionsFromClinical(appointment.clinical, initialTemplate) : {};
  });
  const [restrictedOpen, setRestrictedOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(0);
  const locked = appointment.status === "cancelado" || appointment.status === "faltou";
  const templates = useMemo(() => mergeClinicalTemplates(customTemplates), [customTemplates]);
  const template = useMemo(() => resolveClinicalTemplate(templateId, customTemplates), [templateId, customTemplates]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const items = await listClinicalNoteTemplates();
        if (active) setCustomTemplates(items);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoadingTemplates(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!template || !onClinicalChange) return;
    onClinicalChange(applySectionsToClinicalRecord(clinical, template, sectionDraft));
  }, [clinical, onClinicalChange, sectionDraft, template]);

  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const persist = useCallback(
    async (silent: boolean) => {
      if (locked) return;
      setSaving(true);
      try {
        const merged = template
          ? applySectionsToClinicalRecord(clinical, template, sectionDraft)
          : clinical;
        await saveClinical(appointment.id, merged, { silent });
        setClinical(merged);
        setSavedAt(new Date().toISOString());
        setDirty(false);
      } catch (error) {
        if (!silent) toast.error(error instanceof Error ? error.message : "Não foi possível salvar a ficha.");
      } finally {
        setSaving(false);
      }
    },
    [appointment.id, clinical, locked, saveClinical, sectionDraft, template]
  );

  useDebouncedEffect(
    () => {
      if (!autosave || locked || !dirty) return;
      void persist(true);
    },
    [autosave, dirty, locked, clinical, sectionDraft, templateId],
    900
  );

  function setSection(key: string, value: string) {
    setSectionDraft((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function set<K extends keyof ClinicalRecord>(key: K, value: ClinicalRecord[K]) {
    setClinical((current) => ({ ...current, [key]: value }));
    setDirty(true);
  }

  function onTemplateChange(nextId: string) {
    setTemplateId(nextId);
    const next = resolveClinicalTemplate(nextId, customTemplates);
    if (next) {
      setSectionDraft(hydrateSectionsFromClinical(clinical, next));
      setClinical((current) => ({ ...current, approach: next.approach, templateId: next.id }));
    }
    setDirty(true);
  }

  function onApproachChange(approach: ClinicalApproachId) {
    const builtin = defaultTemplateForApproach(approach);
    onTemplateChange(builtin.id);
  }

  const saveLabel = saving ? "Salvando..." : savedAt ? `Salvo às ${formatSavedAt(savedAt)}` : dirty ? "Alterações não salvas" : "";

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted" aria-live="polite">
          {autosave ? saveLabel : null}
          {dirty && !saving ? <span className="text-accent"> · offline ou sem salvar</span> : null}
        </p>
        {!autosave && !locked && (
          <button type="button" className="btn-text" disabled={saving || uploading > 0} onClick={() => void persist(false)}>
            Salvar ficha
          </button>
        )}
      </div>
      {!compact && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Abordagem">
            <Select
              value={template?.approach || "tcc"}
              onChange={(value) => onApproachChange(value as ClinicalApproachId)}
              options={Object.entries(CLINICAL_APPROACH_LABELS)
                .filter(([id]) => id !== "custom")
                .map(([value, label]) => ({ value, label }))}
              disabled={locked}
            />
          </Field>
          <Field label="Modelo">
            <Select
              value={templateId}
              onChange={onTemplateChange}
              disabled={locked || loadingTemplates}
              options={templates.map((item) => ({
                value: item.id,
                label: item.id.startsWith("builtin:") ? item.nome : `${item.nome} (personalizado)`,
              }))}
            />
          </Field>
        </div>
      )}
      <div>
        <span className="mb-2 block text-sm font-medium">Humor no dia</span>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((mood) => (
            <button
              key={mood}
              type="button"
              disabled={locked}
              onClick={() => set("mood", mood as Mood)}
              className={`min-h-11 ${clinical.mood === mood ? "btn-chip-active" : "btn-chip"}`}
            >
              {labelMood(mood)}
            </button>
          ))}
        </div>
      </div>
      {template?.sections.map((def) => (
        <Field key={def.key} label={def.label}>
          <textarea
            className={`${fieldClass} ${compact ? "min-h-24" : "min-h-28"}`}
            value={sectionDraft[def.key] ?? ""}
            disabled={locked}
            onChange={(event) => setSection(def.key, event.target.value)}
          />
        </Field>
      ))}
      {!compact && (
        <>
          <FileAttachments
            label="Ficha de Anamnese"
            description="Documentos da anamnese. Salve para gravar."
            files={clinical.anamneseArquivos}
            onChange={(anamneseArquivos) => set("anamneseArquivos", anamneseArquivos)}
            uploadTarget={{ kind: "appointment-anamnese", appointmentId: appointment.id }}
            kind="documento"
            disabled={locked}
            onBusy={(busy) => setUploading((count) => count + (busy ? 1 : -1))}
          />
          <FileAttachments
            label="Atividades desenvolvidas"
            description="Documentos das atividades. Salve para gravar."
            files={clinical.atividadesArquivos}
            onChange={(atividadesArquivos) => set("atividadesArquivos", atividadesArquivos)}
            uploadTarget={{ kind: "appointment-atividade", appointmentId: appointment.id }}
            kind="documento"
            disabled={locked}
            onBusy={(busy) => setUploading((count) => count + (busy ? 1 : -1))}
          />
          {!restrictedOpen ? (
            <button type="button" className="btn-text min-h-11 text-left" onClick={() => setRestrictedOpen(true)}>
              Mostrar registro restrito
            </button>
          ) : (
            <Field label="Registro restrito">
              <textarea
                className={`${fieldClass} min-h-24`}
                value={clinical.restrictedNote}
                disabled={locked}
                onChange={(event) => set("restrictedNote", event.target.value)}
              />
            </Field>
          )}
        </>
      )}
    </div>
  );
}
