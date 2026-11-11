"use client";

import { useState } from "react";
import { Field, fieldClass } from "@/components/admin/ui";

/**
 * Formulário de falta: justificada ou não + texto da justificativa.
 * Usado ao registrar a falta e ao corrigir uma falta já registrada.
 */
export default function AbsenceForm({
  initialJustificada = false,
  initialTexto = "",
  submitLabel,
  savingLabel = "Salvando...",
  onSubmit,
  onCancel,
}: {
  initialJustificada?: boolean;
  initialTexto?: string;
  submitLabel: string;
  savingLabel?: string;
  onSubmit: (input: { justificada: boolean; texto: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [justificada, setJustificada] = useState(initialJustificada);
  const [texto, setTexto] = useState(initialTexto);
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="mt-4 grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
          await onSubmit({ justificada, texto });
        } finally {
          setSaving(false);
        }
      }}
    >
      <fieldset className="grid gap-2" data-tour="falta-justificada">
        <legend className="mb-1.5 text-sm font-medium text-ink">A falta foi justificada?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className={`${!justificada ? "btn-chip-active" : "btn-chip"} min-h-11 justify-start gap-3`}>
            <input
              type="radio"
              name="falta-justificada"
              className="h-5 w-5"
              checked={!justificada}
              onChange={() => setJustificada(false)}
            />
            Sem justificativa
          </label>
          <label className={`${justificada ? "btn-chip-active" : "btn-chip"} min-h-11 justify-start gap-3`}>
            <input
              type="radio"
              name="falta-justificada"
              className="h-5 w-5"
              checked={justificada}
              onChange={() => setJustificada(true)}
            />
            Justificada
          </label>
        </div>
      </fieldset>
      <Field label={justificada ? "Justificativa (motivo informado pelo paciente)" : "Observação (opcional)"}>
        <textarea
          className={`${fieldClass} min-h-24`}
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          placeholder={justificada ? "Ex.: atestado médico, imprevisto avisado com antecedência" : "Opcional"}
          data-tour="falta-justificativa"
        />
      </Field>
      <p className="text-sm text-muted">
        A cobrança segue as suas regras de falta. Você pode revisar o resultado logo depois.
      </p>
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" disabled={saving}>
          {saving ? savingLabel : submitLabel}
        </button>
        <button type="button" className="btn-text" onClick={onCancel}>
          Voltar
        </button>
      </div>
    </form>
  );
}
