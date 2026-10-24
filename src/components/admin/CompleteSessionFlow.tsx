"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import ClinicalRecordEditor from "@/components/admin/ClinicalRecordEditor";
import Drawer from "@/components/admin/Drawer";
import Select from "@/components/admin/Select";
import { Field, fieldClass } from "@/components/admin/ui";
import { formatMoney } from "@/lib/admin/format";
import { defaultSessionClosePayment, type SessionClosePaymentInput } from "@/lib/admin/session-close";
import { useClinic } from "@/lib/admin/clinic-context";
import type { Appointment, ClinicalRecord, PaymentMethod } from "@/lib/admin/types";
import { emptyClinical } from "@/lib/admin/types";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
  { value: "transferencia", label: "Transferência" },
  { value: "outro", label: "Outro" },
];

export default function CompleteSessionFlow({
  appointment,
  open,
  onClose,
}: {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
}) {
  const { packages, payments, completeSession, issueFiscalReceipt } = useClinic();
  const [markComplete, setMarkComplete] = useState(true);
  const [writeEvolution, setWriteEvolution] = useState(true);
  const [registerPayment, setRegisterPayment] = useState(false);
  const [issueReceipt, setIssueReceipt] = useState(false);
  const [payment, setPayment] = useState<SessionClosePaymentInput | null>(null);
  const [clinicalDraft, setClinicalDraft] = useState<ClinicalRecord>(emptyClinical());
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const existingPayment = useMemo(
    () => (appointment ? payments.find((item) => item.appointmentId === appointment.id && item.origem === "paciente") : null),
    [appointment, payments]
  );

  useEffect(() => {
    if (!appointment || !open) return;
    setMarkComplete(appointment.status !== "concluido");
    setWriteEvolution(true);
    setRegisterPayment(Boolean(existingPayment) || appointment.valor > 0);
    setIssueReceipt(false);
    setPayment(defaultSessionClosePayment(appointment, packages, existingPayment ?? null));
    setClinicalDraft({ ...emptyClinical(), ...appointment.clinical });
    setSuccess(false);
  }, [appointment, existingPayment, open, packages]);

  async function onSubmit() {
    if (!appointment) return;
    setBusy(true);
    try {
      const { paymentId } = await completeSession(appointment.id, {
        markComplete,
        clinical: writeEvolution ? clinicalDraft : null,
        payment: registerPayment && payment ? payment : null,
      });
      if (issueReceipt && paymentId) {
        try {
          await issueFiscalReceipt(paymentId, { replace: false });
        } catch (error) {
          toast.warn(error instanceof Error ? error.message : "Recibo não gerado; confira Configurações e o pagamento.");
        }
      }
      setSuccess(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir a sessão.");
    } finally {
      setBusy(false);
    }
  }

  const footer = success ? (
    <div className="flex flex-wrap gap-3">
      <button type="button" className="btn-primary min-h-11" onClick={onClose}>
        Fechar
      </button>
    </div>
  ) : (
    <div className="flex flex-wrap gap-3">
      <button type="button" className="btn-primary min-h-11" disabled={busy || !appointment} onClick={() => void onSubmit()}>
        {busy ? "Salvando..." : "Salvar"}
      </button>
      <button type="button" className="btn-text min-h-11" disabled={busy} onClick={onClose}>
        Cancelar
      </button>
    </div>
  );

  return (
    <Drawer open={open} title="Concluir sessão" onClose={onClose} footer={footer}>
      {!appointment ? null : success ? (
        <div className="rounded-2xl border border-[#d7e0d8] bg-paper p-4">
          <p className="font-medium text-teal">Sessão registrada com sucesso.</p>
          <p className="mt-2 text-sm text-muted">
            {markComplete ? "Status atualizado." : ""}
            {writeEvolution ? " Evolução salva no prontuário." : ""}
            {registerPayment ? " Pagamento registrado." : ""}
            {issueReceipt ? " Recibo gerado quando elegível." : ""}
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={markComplete}
              onChange={(event) => setMarkComplete(event.target.checked)}
            />
            <span>
              <strong>Marcar como concluída</strong>
              <span className="mt-0.5 block text-muted">Atualiza o status e prepara o link de feedback.</span>
            </span>
          </label>
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={writeEvolution}
              onChange={(event) => setWriteEvolution(event.target.checked)}
            />
            <span>
              <strong>Registrar evolução</strong>
              <span className="mt-0.5 block text-muted">Modelo por abordagem; autosave enquanto edita.</span>
            </span>
          </label>
          {writeEvolution && (
            <ClinicalRecordEditor
              appointment={{ ...appointment, clinical: clinicalDraft }}
              compact
              autosave={false}
              onClinicalChange={setClinicalDraft}
            />
          )}
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={registerPayment}
              onChange={(event) => setRegisterPayment(event.target.checked)}
            />
            <span>
              <strong>Registrar pagamento</strong>
              <span className="mt-0.5 block text-muted">
                Valor sugerido: {formatMoney(payment?.valor ?? 0)}
                {existingPayment ? " (lançamento existente)" : ""}
              </span>
            </span>
          </label>
          {registerPayment && payment && (
            <div className="grid gap-3 rounded-2xl border border-[#e7eee8] p-4">
              <Field label="Valor (R$)">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={fieldClass}
                  value={payment.valor}
                  onChange={(event) =>
                    setPayment((current) => current && { ...current, valor: Number(event.target.value) || 0 })
                  }
                />
              </Field>
              <Field label="Forma de pagamento">
                <Select
                  value={payment.formaPagamento}
                  onChange={(value) =>
                    setPayment((current) => current && { ...current, formaPagamento: value as PaymentMethod })
                  }
                  options={PAYMENT_METHODS}
                />
              </Field>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={payment.markPaid}
                  onChange={(event) => setPayment((current) => current && { ...current, markPaid: event.target.checked })}
                />
                Marcar como pago agora
              </label>
            </div>
          )}
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={issueReceipt}
              disabled={!registerPayment}
              onChange={(event) => setIssueReceipt(event.target.checked)}
            />
            <span>
              <strong>Gerar recibo PDF</strong>
              <span className="mt-0.5 block text-muted">Requer pagamento quitado e dados fiscais em Configurações.</span>
            </span>
          </label>
        </div>
      )}
    </Drawer>
  );
}
