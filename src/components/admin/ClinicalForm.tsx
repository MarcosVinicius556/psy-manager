"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import ClinicalRecordEditor from "@/components/admin/ClinicalRecordEditor";
import { useClinic } from "@/lib/admin/clinic-context";
import { emptyClinical, type Appointment, type ClinicalRecord } from "@/lib/admin/types";

export default function ClinicalForm({ appointment }: { appointment: Appointment }) {
  const { setAppointmentStatus } = useClinic();
  const [clinical, setClinical] = useState<ClinicalRecord>({
    ...emptyClinical(),
    ...appointment.clinical,
    anamneseArquivos: appointment.clinical.anamneseArquivos ?? [],
    atividadesArquivos: appointment.clinical.atividadesArquivos ?? [],
  });
  const [saving, setSaving] = useState(false);
  const locked = appointment.status === "cancelado" || appointment.status === "faltou";

  async function conclude() {
    if (!clinical.mood) {
      toast.error("Informe o humor do paciente neste atendimento.");
      return;
    }
    if (!clinical.clinicalEvolution.trim()) {
      toast.error("Descreva a evolução clínica antes de concluir.");
      return;
    }
    setSaving(true);
    try {
      await setAppointmentStatus(appointment.id, "concluido", clinical);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a ficha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <ClinicalRecordEditor appointment={{ ...appointment, clinical }} autosave={!locked} onClinicalChange={setClinical} />
      {!locked && (
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-primary min-h-11" disabled={saving} onClick={() => void conclude()}>
            {saving ? "Salvando..." : "Finalizar atendimento"}
          </button>
        </div>
      )}
    </div>
  );
}
