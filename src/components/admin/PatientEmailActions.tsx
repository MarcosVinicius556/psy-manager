"use client";

import { useMemo, useState } from "react";
import EmailSendPreviewModal from "@/components/admin/EmailSendPreviewModal";
import { useAuth } from "@/lib/admin/auth-context";
import { useClinic } from "@/lib/admin/clinic-context";
import { formatDate, formatMoney } from "@/lib/admin/format";
import { remainingAmount } from "@/lib/admin/finance";
import { buildPaymentPixBrcode } from "@/lib/pix/build-charge";
import { listEmailTemplates } from "@/lib/admin/collections";
import type { EmailTemplate } from "@/lib/email-integration/types";
import type { Patient, Payment } from "@/lib/admin/types";
import Select from "./Select";
import { useEffect } from "react";

function buildContext(
  patient: Patient,
  professionalNome: string,
  payment?: Payment
) {
  return {
    paciente_nome: patient.nome,
    profissional_nome: professionalNome,
    clinica_nome: professionalNome,
    descricao: payment?.descricao || "",
    valor: payment ? formatMoney(payment.valorAcordado || payment.valor) : "",
    data_pagamento: payment?.paidAt ? formatDate(payment.paidAt.slice(0, 10)) : "",
  };
}

export function PatientEmailLog({ patientId }: { patientId: string }) {
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof import("@/lib/admin/collections").listEmailLogForPatient>>>([]);
  useEffect(() => {
    void import("@/lib/admin/collections").then(({ listEmailLogForPatient }) =>
      listEmailLogForPatient(patientId).then(setLogs)
    );
  }, [patientId]);
  if (logs.length === 0) return null;
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-teal">E-mails enviados</h3>
      <ul className="mt-2 grid gap-2">
        {logs.map((item) => (
          <li key={item.id} className="rounded-[var(--radius-control)] border border-leaf bg-paper px-3 py-2 text-sm">
            <p className="font-medium text-ink">{item.subject}</p>
            <p className="text-muted text-xs">{item.to} · {item.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PatientFreeEmailSend({ patient }: { patient: Patient }) {
  const { user } = useAuth();
  const { members } = useClinic();
  const me = members.find((member) => member.uid === user?.uid || member.email === user?.email?.toLowerCase());
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void listEmailTemplates().then((items) => {
      setTemplates(items);
      if (items[0]) setTemplateId(items[0].id);
    });
  }, []);

  const selected = useMemo(() => templates.find((item) => item.id === templateId), [templates, templateId]);

  if (!patient.email?.trim()) {
    return <p className="text-sm text-muted">Cadastre o e-mail do paciente para enviar mensagens.</p>;
  }

  return (
    <div className="grid gap-3">
      <Select
        value={templateId}
        onChange={setTemplateId}
        options={templates.map((item) => ({ value: item.id, label: item.nome }))}
        placeholder="Escolha um modelo"
      />
      <button type="button" className="btn-row justify-self-start" disabled={!selected} onClick={() => setOpen(true)}>
        Enviar por e-mail
      </button>
      {selected ? (
        <EmailSendPreviewModal
          open={open}
          onClose={() => setOpen(false)}
          title="Enviar e-mail ao paciente"
          subject={selected.assunto}
          corpo={selected.corpo}
          context={buildContext(patient, me?.nome || "Profissional")}
          defaultTo={patient.email}
          templateId={selected.id}
          templateNome={selected.nome}
          patientId={patient.id}
          relatedType="patient"
          relatedId={patient.id}
        />
      ) : null}
    </div>
  );
}

export function PaymentPixCobrancaEmailButton({ patient, payment }: { patient: Patient; payment: Payment }) {
  const { user } = useAuth();
  const { members } = useClinic();
  const me = members.find((member) => member.uid === user?.uid || member.email === user?.email?.toLowerCase());
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const remaining = remainingAmount(payment);
  const canSend = remaining > 0 && payment.status !== "nao_pago" && payment.status !== "pago";

  useEffect(() => {
    void listEmailTemplates().then((items) => {
      const match = items.find((item) => item.trigger === "cobranca_pix") || items[0];
      setTemplate(match || null);
    });
  }, []);

  if (!canSend || !patient.email?.trim() || !template || !me) return null;
  const pix = buildPaymentPixBrcode(me, payment);
  if (!pix.ok) return null;

  const context = {
    ...buildContext(patient, me.nome || "Profissional", payment),
    valor: formatMoney(remaining),
    vencimento: formatDate(payment.dueDate),
    pix_copia_cola: pix.code,
  };

  return (
    <>
      <button type="button" className="btn-chip" onClick={() => setOpen(true)}>
        Enviar Pix
      </button>
      <EmailSendPreviewModal
        open={open}
        onClose={() => setOpen(false)}
        title="Enviar cobrança com Pix"
        subject={template.assunto}
        corpo={template.corpo}
        context={context}
        defaultTo={patient.email}
        templateId={template.id}
        templateNome={template.nome}
        patientId={patient.id}
        paymentId={payment.id}
        relatedType="payment"
        relatedId={payment.id}
      />
    </>
  );
}

export function PaymentEmailSendButton({ patient, payment }: { patient: Patient; payment: Payment }) {
  const { user } = useAuth();
  const { members } = useClinic();
  const me = members.find((member) => member.uid === user?.uid || member.email === user?.email?.toLowerCase());
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    void listEmailTemplates().then((items) => {
      const match = items.find((item) => item.trigger === "confirmacao_pagamento") || items[0];
      setTemplate(match || null);
    });
  }, []);

  if (payment.status !== "pago" || !patient.email?.trim() || !template) return null;

  return (
    <>
      <button type="button" className="btn-chip" onClick={() => setOpen(true)}>
        Enviar por e-mail
      </button>
      <EmailSendPreviewModal
        open={open}
        onClose={() => setOpen(false)}
        title="Confirmar pagamento por e-mail"
        subject={template.assunto}
        corpo={template.corpo}
        context={buildContext(patient, me?.nome || "Profissional", payment)}
        defaultTo={patient.email}
        templateId={template.id}
        templateNome={template.nome}
        patientId={patient.id}
        paymentId={payment.id}
        relatedType="payment"
        relatedId={payment.id}
      />
    </>
  );
}
