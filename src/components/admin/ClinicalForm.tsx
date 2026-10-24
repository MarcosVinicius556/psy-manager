"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { MOODS, labelMood } from "@/lib/admin/format";
import { useClinic } from "@/lib/admin/clinic-context";
import { emptyClinical, type Appointment, type ClinicalRecord, type Mood } from "@/lib/admin/types";
import FileAttachments from "./FileAttachments";
import { Field, fieldClass } from "./ui";

export default function ClinicalForm({ appointment }: { appointment: Appointment }) {
  const { saveClinical, setAppointmentStatus } = useClinic();
  const [clinical, setClinical] = useState<ClinicalRecord>({
    ...emptyClinical(),
    ...appointment.clinical,
    anamneseArquivos: appointment.clinical.anamneseArquivos ?? [],
    atividadesArquivos: appointment.clinical.atividadesArquivos ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const locked = appointment.status === "cancelado" || appointment.status === "faltou";

  function set<K extends keyof ClinicalRecord>(key: K, value: ClinicalRecord[K]) {
    setClinical((current) => ({ ...current, [key]: value }));
  }

  async function persist(conclude: boolean) {
    if (conclude && !clinical.mood) {
      toast.error("Informe o humor do paciente neste atendimento.");
      return;
    }
    if (conclude && !clinical.clinicalEvolution.trim()) {
      toast.error("Descreva a evolução clínica antes de concluir.");
      return;
    }
    setSaving(true);
    try {
      if (conclude) await setAppointmentStatus(appointment.id, "concluido", clinical);
      else await saveClinical(appointment.id, clinical);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a ficha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div>
        <span className="mb-2 block text-sm font-medium">Humor no dia</span>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((mood) => (
            <button
              key={mood}
              type="button"
              disabled={locked}
              onClick={() => set("mood", mood as Mood)}
              className={clinical.mood === mood ? "btn-chip-active" : "btn-chip"}
            >
              {labelMood(mood)}
            </button>
          ))}
        </div>
      </div>
      <Field label="Evolução clínica">
        <textarea
          className={`${fieldClass} min-h-32`}
          value={clinical.clinicalEvolution}
          disabled={locked}
          onChange={(event) => set("clinicalEvolution", event.target.value)}
        />
      </Field>
      <Field label="Anotações da psicóloga">
        <textarea
          className={`${fieldClass} min-h-28`}
          value={clinical.notes}
          disabled={locked}
          onChange={(event) => set("notes", event.target.value)}
        />
      </Field>
      <details className="rounded-md bg-paper p-4">
        <summary className="cursor-pointer font-medium text-teal">Ficha complementar de psicologia</summary>
        <div className="mt-4 grid gap-4">
          {(
            [
              ["aspectosCognitivos", "Aspectos cognitivos"],
              ["aspectosEmocionais", "Aspectos emocionais"],
              ["intervencoes", "Intervenções"],
              ["objetivos", "Objetivos"],
              ["evolucaoSessao", "Evolução da sessão"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <textarea
                className={`${fieldClass} min-h-24`}
                value={clinical[key]}
                disabled={locked}
                onChange={(event) => set(key, event.target.value)}
              />
            </Field>
          ))}
        </div>
      </details>
      <FileAttachments
        label="Ficha de Anamnese"
        description="Documentos e imagens da anamnese. PNG, JPG, WebP ou PDF, até 10 MB. Salve a ficha para gravar."
        files={clinical.anamneseArquivos}
        onChange={(anamneseArquivos) => set("anamneseArquivos", anamneseArquivos)}
        uploadTarget={{ kind: "appointment-anamnese", appointmentId: appointment.id }}
        kind="documento"
        disabled={locked}
        onBusy={(busy) => setUploading((count) => count + (busy ? 1 : -1))}
      />
      <FileAttachments
        label="Atividades desenvolvidas"
        description="Documentos e imagens das atividades desenvolvidas neste atendimento. PNG, JPG, WebP ou PDF, até 10 MB. Salve a ficha para gravar."
        files={clinical.atividadesArquivos}
        onChange={(atividadesArquivos) => set("atividadesArquivos", atividadesArquivos)}
        uploadTarget={{ kind: "appointment-atividade", appointmentId: appointment.id }}
        kind="documento"
        disabled={locked}
        onBusy={(busy) => setUploading((count) => count + (busy ? 1 : -1))}
      />
      {!locked && (
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-text" disabled={saving || uploading > 0} onClick={() => persist(false)}>
            Salvar ficha
          </button>
          <button type="button" className="btn-primary" disabled={saving || uploading > 0} onClick={() => persist(true)}>
            {saving ? "Salvando..." : "Finalizar atendimento"}
          </button>
        </div>
      )}
    </div>
  );
}
