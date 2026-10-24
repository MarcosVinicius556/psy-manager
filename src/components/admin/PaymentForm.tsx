"use client";

import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useClinic } from "@/lib/admin/clinic-context";
import { formatDate, monthlyDates, PAYMENT_METHOD_OPTIONS, shiftMonth, todayISO } from "@/lib/admin/format";
import type { PaymentMethod, PaymentOrigin } from "@/lib/admin/types";
import DateField from "./DateField";
import Select from "./Select";
import { Field, fieldClass } from "./ui";

export default function PaymentForm({
  patientId = "",
  onSaved,
}: {
  patientId?: string;
  onSaved?: () => void;
}) {
  const { patients, appointments, savePayment } = useClinic();
  const [origem, setOrigem] = useState<PaymentOrigin>("paciente");
  const [recurring, setRecurring] = useState(false);
  const [until, setUntil] = useState("");
  const [untilEdited, setUntilEdited] = useState(false);
  const [form, setForm] = useState({
    patientId,
    appointmentId: "",
    descricao: "Sessão",
    valor: "",
    dueDate: todayISO(),
    formaPagamento: "pix" as PaymentMethod,
  });
  const [saving, setSaving] = useState(false);
  const external = origem === "externo";
  const sessions = useMemo(
    () => appointments.filter((item) => item.patientId === form.patientId && item.status !== "cancelado"),
    [appointments, form.patientId]
  );
  const repeatUntil = untilEdited ? until : form.dueDate ? shiftMonth(form.dueDate, 11) : "";
  const preview = external && recurring ? monthlyDates(form.dueDate, repeatUntil, 37) : [];

  function chooseOrigin(next: PaymentOrigin) {
    setOrigem(next);
    if (next === "externo") {
      setForm((current) => ({
        ...current,
        patientId: "",
        appointmentId: "",
        descricao: current.descricao === "Sessão" ? "" : current.descricao,
      }));
      return;
    }
    setRecurring(false);
    setForm((current) => ({
      ...current,
      patientId: current.patientId || patientId,
      descricao: current.descricao.trim() ? current.descricao : "Sessão",
    }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await savePayment(
        {
          patientId: external ? "" : form.patientId,
          appointmentId: external ? null : form.appointmentId || null,
          origem,
          recorrente: external && recurring,
          descricao: form.descricao,
          valor: Number(form.valor.replace(",", ".")),
          dueDate: form.dueDate,
          formaPagamento: form.formaPagamento,
        },
        external && recurring ? repeatUntil : undefined
      );
      if (onSaved) onSaved();
      else {
        setForm((current) => ({
          ...current,
          descricao: external ? "" : "Sessão",
          valor: "",
          appointmentId: "",
        }));
        setRecurring(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível lançar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <span className="mb-1.5 block text-sm font-medium text-ink">Tipo de lançamento</span>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={origem === "paciente" ? "btn-chip-active" : "btn-chip"} onClick={() => chooseOrigin("paciente")}>
            Paciente
          </button>
          <button type="button" className={external ? "btn-chip-active" : "btn-chip"} onClick={() => chooseOrigin("externo")}>
            Renda externa
          </button>
        </div>
        {external && (
          <p className="mt-2 text-sm text-muted">Trabalho fora dos atendimentos. Este lançamento não vincula paciente nem sessão.</p>
        )}
      </div>
      {!external && (
        <>
          <Field label="Paciente">
            <Select
              required
              value={form.patientId}
              onChange={(next) => setForm({ ...form, patientId: next, appointmentId: "" })}
              options={[{ value: "", label: "Selecione" }, ...patients.map((patient) => ({ value: patient.id, label: patient.nome }))]}
            />
          </Field>
          <Field label="Atendimento vinculado">
            <Select
              value={form.appointmentId}
              onChange={(next) => {
                const session = sessions.find((item) => item.id === next);
                setForm({
                  ...form,
                  appointmentId: next,
                  valor: session ? String(session.valor).replace(".", ",") : form.valor,
                  dueDate: session?.date || form.dueDate,
                  descricao: form.descricao.trim() && form.descricao !== "Sessão" ? form.descricao : "Sessão",
                });
              }}
              options={[
                { value: "", label: "Nenhum" },
                ...sessions.map((item) => ({
                  value: item.id,
                  label: `${item.date.split("-").reverse().join("/")} · ${item.startTime}`,
                })),
              ]}
            />
          </Field>
        </>
      )}
      <Field label="Descrição">
        <input
          className={fieldClass}
          value={form.descricao}
          placeholder={external ? "Ex.: Supervisão, palestra, consultoria" : "Sessão"}
          onChange={(event) => setForm({ ...form, descricao: event.target.value })}
          required
        />
      </Field>
      <Field label="Valor">
        <input className={fieldClass} inputMode="decimal" value={form.valor} onChange={(event) => setForm({ ...form, valor: event.target.value })} required />
      </Field>
      <Field label={external && recurring ? "Primeiro vencimento" : "Vencimento"}>
        <DateField value={form.dueDate} onChange={(dueDate) => setForm({ ...form, dueDate })} required />
      </Field>
      <Field label="Forma prevista">
        <Select
          value={form.formaPagamento}
          onChange={(next) => setForm({ ...form, formaPagamento: next as PaymentMethod })}
          options={PAYMENT_METHOD_OPTIONS}
        />
      </Field>
      {external && (
        <div className="md:col-span-2 grid gap-3 rounded-md bg-paper p-4">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(event) => {
                const checked = event.target.checked;
                setRecurring(checked);
                if (checked && form.dueDate && !untilEdited) setUntil(shiftMonth(form.dueDate, 11));
              }}
            />
            Renda recorrente
          </label>
          <p className="text-sm text-muted">O mesmo valor se repete todo mês. Use quando for uma renda fixa.</p>
          {recurring && (
            <>
              <Field label="Repetir até">
                <DateField
                  value={repeatUntil}
                  min={form.dueDate}
                  onChange={(next) => {
                    setUntilEdited(true);
                    setUntil(next);
                  }}
                  required
                />
                <p className="mt-2 text-sm text-muted">Preenchido com 12 meses a partir do primeiro vencimento.</p>
              </Field>
              {preview.length > 0 && (
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-ink">Meses desta renda</span>
                  <div className="grid max-h-40 gap-1 overflow-y-auto">
                    {preview.slice(0, 36).map((date) => (
                      <div key={date} className="rounded-md bg-white px-3 py-2 text-sm font-medium">
                        {formatDate(date)}
                      </div>
                    ))}
                  </div>
                  {preview.length > 36 && <p className="mt-2 text-sm text-accent">A renda recorrente passa de 36 meses. Encurte o período.</p>}
                </div>
              )}
            </>
          )}
        </div>
      )}
      <div className="md:col-span-2">
        <button className="btn-primary" disabled={saving || (external && recurring && preview.length > 36)} type="submit">
          {saving ? "Salvando..." : external ? (recurring ? "Agendar renda externa" : "Lançar renda externa") : "Agendar pagamento"}
        </button>
      </div>
    </form>
  );
}
