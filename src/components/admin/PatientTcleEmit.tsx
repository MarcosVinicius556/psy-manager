"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import Select from "@/components/admin/Select";
import FileAttachments from "@/components/admin/FileAttachments";
import { Field, fieldClass } from "@/components/admin/ui";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import { formatDate, labelModality } from "@/lib/admin/format";
import { downloadTclePdf } from "@/lib/admin/tcle";
import type { Modality, Patient, TcleAcceptanceMethod } from "@/lib/admin/types";

export default function PatientTcleEmit({ patient, defaultModality = "presencial" }: { patient: Patient; defaultModality?: Modality }) {
  const { user } = useAuth();
  const { members, saveTcleAcceptance } = useClinic();
  const me = members.find((member) => member.uid === user?.uid || member.email === user?.email?.toLowerCase());
  const [modality, setModality] = useState<Modality>(defaultModality);
  const [method, setMethod] = useState<TcleAcceptanceMethod>("papel");
  const [acceptedAt, setAcceptedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [emitting, setEmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onDownload() {
    setEmitting(true);
    try {
      await downloadTclePdf({
        patient,
        professional: me ?? null,
        modalityLabel: labelModality(modality),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o TCLE.");
    } finally {
      setEmitting(false);
    }
  }

  async function onSaveAcceptance(files: import("@/lib/admin/types").ClinicAttachment[]) {
    setSaving(true);
    try {
      await saveTcleAcceptance(patient.id, {
        acceptedAt: new Date(`${acceptedAt}T12:00:00`).toISOString(),
        method,
        arquivo: files[0] ?? null,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar o aceite.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Modalidade no termo">
          <Select
            value={modality}
            onChange={(value) => setModality(value as Modality)}
            options={[
              { value: "presencial", label: "Presencial" },
              { value: "online", label: "Online (TIC)" },
            ]}
          />
        </Field>
        <div className="flex items-end">
          <button type="button" className="btn-primary min-h-11 w-full sm:w-auto" disabled={emitting} onClick={() => void onDownload()}>
            {emitting ? "Gerando PDF..." : "Baixar TCLE preenchido"}
          </button>
        </div>
      </div>
      {patient.tcleAceite ? (
        <p className="text-sm text-muted">
          Aceite registrado em {formatDate(patient.tcleAceite.acceptedAt.slice(0, 10))} (
          {patient.tcleAceite.method === "digital" ? "aceite digital" : "assinado em papel"}).
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Data do aceite">
          <input
            type="date"
            className={fieldClass}
            value={acceptedAt}
            onChange={(event) => setAcceptedAt(event.target.value)}
          />
        </Field>
        <Field label="Forma de aceite">
          <Select
            value={method}
            onChange={(value) => setMethod(value as TcleAcceptanceMethod)}
            options={[
              { value: "papel", label: "Assinado em papel" },
              { value: "digital", label: "Aceite digital" },
            ]}
          />
        </Field>
      </div>
      <FileAttachments
        label="Comprovante do aceite (opcional)"
        description="Anexe o TCLE assinado ou evidência do aceite digital."
        files={patient.tcleAceite?.arquivo ? [patient.tcleAceite.arquivo] : []}
        onChange={(files) => void onSaveAcceptance(files)}
        uploadTarget={{ kind: "patient-tcle", patientId: patient.id }}
        kind="documento"
        multiple={false}
        disabled={saving}
      />
      <button type="button" className="btn-row min-h-11 w-fit" disabled={saving} onClick={() => void onSaveAcceptance([])}>
        {saving ? "Salvando..." : "Registrar aceite sem anexo"}
      </button>
    </div>
  );
}
