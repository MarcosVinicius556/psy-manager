"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import Select from "@/components/admin/Select";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import type { Modality, Patient } from "@/lib/admin/types";
import type { SignatureDocKind } from "@/lib/server/signature-requests";
import { useContractTemplates } from "./PatientContractEmit";

export function signatureLink(token: string) {
  return `${window.location.origin}/assinar/${token}`;
}

const KIND_OPTIONS: { value: SignatureDocKind; label: string }[] = [
  { value: "tcle", label: "TCLE" },
  { value: "contrato", label: "Contrato" },
  { value: "consentimento_gravacao", label: "Consentimento — gravação" },
  { value: "consentimento_imagem", label: "Consentimento — imagem" },
];

export default function SignatureShare({
  patient,
  defaultModality = "presencial",
}: {
  patient: Patient;
  defaultModality?: Modality;
}) {
  const { templates, loading } = useContractTemplates();
  const [kind, setKind] = useState<SignatureDocKind>("tcle");
  const [modality, setModality] = useState<Modality>(defaultModality);
  const [contractTemplateId, setContractTemplateId] = useState("");
  const [link, setLink] = useState("");
  const [creating, setCreating] = useState(false);

  async function createLink() {
    setCreating(true);
    try {
      const headers = await authorizedHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/signature-requests", {
        method: "POST",
        headers,
        body: JSON.stringify({
          patientId: patient.id,
          kind,
          modality,
          contractTemplateId: kind === "contrato" ? contractTemplateId : undefined,
        }),
      });
      if (!response.ok) throw new Error("Falha ao gerar link");
      const payload = (await response.json()) as { token: string };
      setLink(signatureLink(payload.token));
      toast.success("Link de assinatura criado.");
    } catch {
      toast.error("Não foi possível criar o link.");
    } finally {
      setCreating(false);
    }
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          Documento
          <Select value={kind} onChange={(value) => setKind(value as SignatureDocKind)} options={KIND_OPTIONS} />
        </label>
        {kind === "tcle" ? (
          <label className="grid gap-1 text-sm">
            Modalidade no TCLE
            <Select
              value={modality}
              onChange={(value) => setModality(value as Modality)}
              options={[
                { value: "presencial", label: "Presencial" },
                { value: "online", label: "Online" },
              ]}
            />
          </label>
        ) : null}
        {kind === "contrato" && !loading ? (
          <label className="grid gap-1 text-sm sm:col-span-2">
            Modelo de contrato
            <Select
              value={contractTemplateId}
              onChange={setContractTemplateId}
              options={templates.map((item) => ({ value: item.id, label: item.nome }))}
            />
          </label>
        ) : null}
      </div>
      <button type="button" className="btn-primary w-fit min-h-11" disabled={creating} onClick={() => void createLink()}>
        {creating ? "Gerando..." : "Gerar link para o paciente"}
      </button>
      {link ? (
        <div className="grid gap-2">
          <input className="rounded-control border border-[var(--color-border-subtle)] bg-paper px-3 py-2 text-sm" readOnly value={link} />
          <button type="button" className="btn-row w-fit" onClick={copy}>Copiar link</button>
          <p className="text-sm text-muted">O link expira em 30 dias e só pode ser assinado uma vez.</p>
        </div>
      ) : null}
    </div>
  );
}
