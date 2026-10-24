"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { uploadClinicFile } from "@/lib/admin/attachments";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import { maskCpf, maskPhone } from "@/lib/masks";
import type { Patient, PatientInput } from "@/lib/admin/types";
import SecureMediaImage from "@/components/admin/SecureMediaImage";
import DateField from "./DateField";
import Select from "./Select";
import { Field, fieldClass } from "./ui";
import PatientContractEmit, { emitPatientContract, useContractTemplates } from "./PatientContractEmit";

export default function PatientForm({
  patient,
  onSaved,
}: {
  patient?: Patient;
  onSaved?: (id: string) => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { savePatient, members } = useClinic();
  const me = members.find((member) => member.uid === user?.uid || member.email === user?.email?.toLowerCase());
  const { templates } = useContractTemplates();
  const [form, setForm] = useState<PatientInput>({
    nome: patient?.nome ?? "",
    cpf: maskCpf(patient?.cpf ?? ""),
    cpfPagador: maskCpf(patient?.cpfPagador ?? ""),
    cpfBeneficiario: maskCpf(patient?.cpfBeneficiario ?? ""),
    nascimento: patient?.nascimento ?? "",
    telefone: maskPhone(patient?.telefone ?? ""),
    email: patient?.email ?? "",
    endereco: patient?.endereco ?? "",
    contatoEmergencia: patient?.contatoEmergencia ?? "",
    observacoes: patient?.observacoes ?? "",
    foto: patient?.foto ?? "",
    fotoAsset: patient?.fotoAsset ?? null,
    status: patient?.status ?? "ativo",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [contractId, setContractId] = useState("");
  const [emitOnSave, setEmitOnSave] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const nextStep = useRef<"save" | "appointment">("save");

  function set<K extends keyof PatientInput>(key: K, value: PatientInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const uploaded = await uploadClinicFile(file, { kind: "patient-photo" }, "foto");
      if (uploaded.asset) {
        set("fotoAsset", uploaded.asset);
        set("foto", "");
      } else {
        set("foto", uploaded.url || "");
        set("fotoAsset", null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a foto.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const step = nextStep.current;
    nextStep.current = "save";
    setSaving(true);
    try {
      const id = await savePatient(form, patient?.id);
      if (emitOnSave && contractId) {
        const template = templates.find((item) => item.id === contractId);
        if (template) {
          await emitPatientContract(
            {
              ...form,
              id,
              createdAt: patient?.createdAt || new Date().toISOString(),
              contratoAssinado: patient?.contratoAssinado ?? null,
              tcleAceite: patient?.tcleAceite ?? null,
            },
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
        }
      }
      if (step === "appointment") {
        router.push(`/admin/agenda?novo=1&patientId=${id}`);
        return;
      }
      if (onSaved) onSaved(id);
      else router.push(`/admin/pacientes/${id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <Field label="Nome">
        <input className={fieldClass} value={form.nome} onChange={(event) => set("nome", event.target.value)} required />
      </Field>
      <Field label="CPF do paciente (beneficiário padrão)">
        <input
          className={fieldClass}
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          value={form.cpf}
          onChange={(event) => set("cpf", maskCpf(event.target.value))}
        />
      </Field>
      <Field label="CPF do pagador (opcional)">
        <input
          className={fieldClass}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Quem paga a sessão"
          value={form.cpfPagador}
          onChange={(event) => set("cpfPagador", maskCpf(event.target.value))}
        />
        <p className="mt-1 text-xs text-muted">Deixe vazio se o pagador é o próprio paciente.</p>
      </Field>
      <Field label="CPF do beneficiário do serviço (opcional)">
        <input
          className={fieldClass}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Quem recebe o atendimento"
          value={form.cpfBeneficiario}
          onChange={(event) => set("cpfBeneficiario", maskCpf(event.target.value))}
        />
        <p className="mt-1 text-xs text-muted">Use quando for diferente do CPF do paciente (ex.: menor de idade).</p>
      </Field>
      <Field label="Nascimento">
        <DateField value={form.nascimento} onChange={(nascimento) => set("nascimento", nascimento)} />
      </Field>
      <Field label="Telefone">
        <input
          className={fieldClass}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(00) 00000-0000"
          value={form.telefone}
          onChange={(event) => set("telefone", maskPhone(event.target.value))}
          required
        />
      </Field>
      <Field label="E-mail">
        <input type="email" className={fieldClass} value={form.email} onChange={(event) => set("email", event.target.value)} />
      </Field>
      <Field label="Status">
        <Select
          value={form.status}
          onChange={(next) => set("status", next as PatientInput["status"])}
          options={[
            { value: "ativo", label: "Ativo" },
            { value: "inativo", label: "Inativo" },
          ]}
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="Endereço">
          <input className={fieldClass} value={form.endereco} onChange={(event) => set("endereco", event.target.value)} />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Contato de emergência">
          <input className={fieldClass} value={form.contatoEmergencia} onChange={(event) => set("contatoEmergencia", event.target.value)} />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Observações">
          <textarea className={`${fieldClass} min-h-28`} value={form.observacoes} onChange={(event) => set("observacoes", event.target.value)} />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Foto do paciente">
          <div className="flex flex-wrap items-center gap-4">
            {form.fotoAsset ? (
              <SecureMediaImage asset={form.fotoAsset} alt="" className="h-24 w-24 rounded-md object-cover" />
            ) : form.foto ? (
              <img src={form.foto} alt="" className="h-24 w-24 rounded-md object-cover" />
            ) : (
              <span className="grid h-24 w-24 place-items-center rounded-md bg-paper text-sm text-muted">Sem foto</span>
            )}
            <div className="flex flex-wrap gap-3">
              <input ref={photoRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onPhoto} />
              <button type="button" className="btn-text" disabled={uploadingPhoto} onClick={() => photoRef.current?.click()}>
                {uploadingPhoto ? "Enviando..." : form.foto || form.fotoAsset ? "Trocar foto" : "Enviar foto"}
              </button>
              {(form.foto || form.fotoAsset) && (
                <button
                  type="button"
                  className="btn-text"
                  disabled={uploadingPhoto}
                  onClick={() => {
                    set("foto", "");
                    set("fotoAsset", null);
                  }}
                >
                  Remover
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-sm text-muted">PNG, JPG ou WebP, até 5 MB. A foto é salva com o paciente.</p>
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Contrato">
          {patient ? (
            <PatientContractEmit patient={patient} />
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted">Cadastre um modelo em Operacional para gerar o contrato depois de salvar.</p>
          ) : (
            <div className="grid gap-3">
              <Select
                value={contractId}
                onChange={setContractId}
                placeholder="Modelo de contrato"
                options={templates.map((item) => ({ value: item.id, label: `${item.nome} (v${item.versao})` }))}
              />
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={emitOnSave}
                  onChange={(event) => {
                    setEmitOnSave(event.target.checked);
                    if (event.target.checked && !contractId && templates[0]) setContractId(templates[0].id);
                  }}
                />
                Gerar contrato ao salvar o paciente
              </label>
            </div>
          )}
        </Field>
      </div>
      <div className="flex flex-wrap gap-3 md:col-span-2">
        <button
          className="btn-primary"
          type="submit"
          disabled={saving || uploadingPhoto}
          onClick={() => {
            nextStep.current = "save";
          }}
        >
          {saving ? "Salvando..." : "Salvar paciente"}
        </button>
        <button
          className="btn-text"
          type="submit"
          disabled={saving || uploadingPhoto}
          onClick={() => {
            nextStep.current = "appointment";
          }}
        >
          Atendimento
        </button>
      </div>
    </form>
  );
}
