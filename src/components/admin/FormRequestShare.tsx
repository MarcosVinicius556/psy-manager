"use client";

import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import Select from "@/components/admin/Select";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import { BUILTIN_FORM_TEMPLATES } from "@/lib/admin/form-templates-builtin";
import type { Patient } from "@/lib/admin/types";

export function formLink(token: string) {
  return `${window.location.origin}/formulario/${token}`;
}

export default function FormRequestShare({ patient }: { patient: Patient }) {
  const options = useMemo(
    () => BUILTIN_FORM_TEMPLATES.map((item) => ({ value: item.id, label: item.nome })),
    []
  );
  const [templateId, setTemplateId] = useState(options[0]?.value ?? "");
  const [link, setLink] = useState("");
  const [creating, setCreating] = useState(false);

  async function createLink() {
    setCreating(true);
    try {
      const headers = await authorizedHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/form-requests", {
        method: "POST",
        headers,
        body: JSON.stringify({ patientId: patient.id, templateId }),
      });
      if (!response.ok) throw new Error("fail");
      const payload = (await response.json()) as { token: string };
      setLink(formLink(payload.token));
      toast.success("Link do formulário criado.");
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
      <label className="grid gap-1 text-sm">
        Modelo
        <Select value={templateId} onChange={setTemplateId} options={options} />
      </label>
      <button type="button" className="btn-primary w-fit min-h-11" disabled={creating || !templateId} onClick={() => void createLink()}>
        {creating ? "Gerando..." : "Gerar link do formulário"}
      </button>
      {link ? (
        <div className="grid gap-2">
          <input className="rounded-control border border-[var(--color-border-subtle)] bg-paper px-3 py-2 text-sm" readOnly value={link} />
          <button type="button" className="btn-row w-fit" onClick={copy}>Copiar link</button>
        </div>
      ) : null}
    </div>
  );
}
