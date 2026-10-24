"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import Select from "@/components/admin/Select";
import { Field } from "@/components/admin/ui";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import { listContractTemplates } from "@/lib/admin/collections";
import { downloadContractPdf, type ContractTemplate } from "@/lib/admin/contract";
import type { Patient } from "@/lib/admin/types";

export function useContractTemplates() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const items = await listContractTemplates();
        if (active) setTemplates(items);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { templates, loading };
}

export async function emitPatientContract(patient: Patient, template: ContractTemplate, professional: Parameters<typeof downloadContractPdf>[0]["professional"]) {
  await downloadContractPdf({
    template: template.conteudo,
    patient,
    professional,
  });
}

export default function PatientContractEmit({ patient }: { patient: Patient }) {
  const { user } = useAuth();
  const { members } = useClinic();
  const me = members.find((member) => member.uid === user?.uid || member.email === user?.email?.toLowerCase());
  const { templates, loading } = useContractTemplates();
  const [templateId, setTemplateId] = useState("");
  const [emitting, setEmitting] = useState(false);

  useEffect(() => {
    if (!templateId && templates[0]) setTemplateId(templates[0].id);
  }, [templateId, templates]);

  async function emit() {
    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      toast.error("Cadastre um modelo de contrato em Operacional para emitir o PDF.");
      return;
    }
    setEmitting(true);
    try {
      await emitPatientContract(
        patient,
        template,
        me
          ? {
              nome: me.nome,
              telefone: me.telefone,
              email: me.email,
              valorBase: me.valorBase,
              valorSocial: me.valorSocial,
            }
          : null
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o contrato.");
    } finally {
      setEmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-muted">Carregando modelos de contrato...</p>;

  if (templates.length === 0) {
    return (
      <p className="text-sm text-muted">
        Nenhum modelo cadastrado.{" "}
        <Link href="/admin/operacional/contrato/novo" className="font-medium text-teal">
          Criar modelo de contrato
        </Link>
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
      <Field label="Modelo">
        <Select
          value={templateId}
          onChange={setTemplateId}
          options={templates.map((item) => ({ value: item.id, label: `${item.nome} (v${item.versao})` }))}
        />
      </Field>
      <button type="button" className="btn-primary" disabled={emitting} onClick={() => void emit()}>
        {emitting ? "Gerando PDF..." : "Gerar contrato"}
      </button>
    </div>
  );
}
