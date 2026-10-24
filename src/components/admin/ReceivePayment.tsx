"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { useClinic } from "@/lib/admin/clinic-context";
import { agreedAmount, paymentHistory, receivedAmount, remainingAmount } from "@/lib/admin/finance";
import { formatDate, formatMoney, labelPaymentMethod, moneyInput, parseMoney, PAYMENT_METHOD_OPTIONS, todayISO } from "@/lib/admin/format";
import { attachmentHasMedia } from "@/lib/cloudinary/asset";
import { openAttachment } from "@/lib/cloudinary/client-media";
import type { ClinicAttachment, Payment, PaymentMethod } from "@/lib/admin/types";
import DateField from "./DateField";
import FileAttachments from "./FileAttachments";
import Select from "./Select";
import { Field, fieldClass } from "./ui";

function eventLabel(tipo: string, parcial: boolean) {
  if (tipo === "lancamento") return "Lançamento";
  if (tipo === "situacao") return "Situação";
  return parcial ? "Pagamento parcial" : "Pagamento";
}

export default function ReceivePayment({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const { appointments, patientName, receivePayment } = useClinic();
  const agreed = agreedAmount(payment);
  const received = receivedAmount(payment);
  const remaining = remainingAmount(payment);
  const session = appointments.find((item) => item.id === payment.appointmentId);
  const sessionValue = session?.valor || agreed;
  const [amount, setAmount] = useState(moneyInput(remaining));
  const [partial, setPartial] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>(payment.formaPagamento || "pix");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState<ClinicAttachment | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [saving, setSaving] = useState(false);
  const history = useMemo(() => paymentHistory(payment), [payment]);
  const parsed = parseMoney(amount);
  const open = remaining > 0 && payment.status !== "nao_pago";

  function changeAmount(value: string) {
    setAmount(value);
    const next = parseMoney(value);
    if (next > 0 && next < remaining - 0.001) setPartial(true);
    if (Math.abs(next - remaining) < 0.001) setPartial(false);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await receivePayment(payment.id, {
        valor: parsed,
        formaPagamento: method,
        data: date,
        observacao: note,
        comprovante: receipt,
      });
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar o pagamento.");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="sheet-host fixed inset-0 z-[90] grid place-items-center bg-ink/40 p-4">
      <div className="sheet-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-md bg-white p-5 shadow-[0_18px_50px_rgba(61,82,64,0.18)] sm:p-6" role="dialog" aria-modal="true">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Financeiro</p>
            <h2 className="mt-1 font-serif text-[clamp(1.5rem,5vw,1.875rem)] leading-tight text-teal">{open ? "Confirmar pagamento" : "Histórico"}</h2>
            <p className="mt-1 text-muted">
              {patientName(payment.patientId)} · {payment.descricao}
            </p>
          </div>
          <button type="button" className="btn-text" onClick={onClose}>
            Fechar
          </button>
        </div>
        <dl className="mb-4 grid gap-3 rounded-md bg-paper px-4 py-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Acordado</dt>
            <dd className="font-num font-semibold">{formatMoney(agreed)}</dd>
          </div>
          <div>
            <dt className="text-muted">Recebido</dt>
            <dd className="font-num font-semibold">{formatMoney(received)}</dd>
          </div>
          <div>
            <dt className="text-muted">Faltante</dt>
            <dd className="font-num font-semibold">{formatMoney(remaining)}</dd>
          </div>
        </dl>
        {session && (
          <p className="mb-4 text-sm text-muted">
            Valor combinado nesta sessão: {formatMoney(sessionValue)}. O valor abaixo é o que o paciente paga agora e pode ser menor.
          </p>
        )}
        {open && (
          <form onSubmit={onSubmit} className="mb-6 grid gap-4">
            <Field label="Valor deste pagamento">
              <input className={fieldClass} inputMode="decimal" value={amount} onChange={(event) => changeAmount(event.target.value)} required />
            </Field>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={partial}
                onChange={(event) => setPartial(event.target.checked)}
              />
              <span>
                <strong className="font-medium">Pagamento parcial</strong>
                <span className="mt-1 block text-muted">
                  O lançamento continua em haver e o faltante é atualizado. Se o valor cobrir o que resta, ele fica quitado.
                </span>
              </span>
            </label>
            <Field label="Forma de pagamento">
              <Select value={method} onChange={(next) => setMethod(next as PaymentMethod)} options={PAYMENT_METHOD_OPTIONS} />
            </Field>
            <Field label="Data do pagamento">
              <DateField value={date} onChange={setDate} required />
            </Field>
            <Field label="Observação">
              <input className={fieldClass} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Opcional" />
            </Field>
            <FileAttachments
              label="Comprovante"
              description="Um PDF ou uma imagem deste recebimento. PNG, JPG, WebP ou PDF, até 10 MB."
              files={receipt ? [receipt] : []}
              onChange={(files) => setReceipt(files[0] ?? null)}
              uploadTarget={{ kind: "payment-receipt", paymentId: payment.id }}
              kind="documento"
              multiple={false}
              onBusy={setUploadingReceipt}
            />
            <button className="btn-primary" type="submit" disabled={saving || uploadingReceipt}>
              {saving ? "Salvando..." : partial || (parsed > 0 && parsed < remaining - 0.001) ? "Registrar parcial" : "Confirmar pagamento"}
            </button>
          </form>
        )}
        <h3 className="mb-2 text-lg font-medium text-teal">Histórico</h3>
        <div className="grid gap-2">
          {history.map((event) => (
            <div key={event.id} className="rounded-md border border-[#e7eee8] px-3 py-2 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <strong>{eventLabel(event.tipo, event.parcial)}</strong>
                <span className="text-muted">{formatDate(event.data)}</span>
              </div>
              <p className="mt-1 text-muted">
                {event.tipo === "situacao" ? event.observacao : formatMoney(event.valor)}
                {event.formaPagamento ? ` · ${labelPaymentMethod(event.formaPagamento)}` : ""}
                {event.tipo !== "situacao" && event.observacao ? ` · ${event.observacao}` : ""}
              </p>
              {event.comprovante && attachmentHasMedia(event.comprovante) && (
                <button
                  type="button"
                  className="btn-text mt-2"
                  onClick={() => openAttachment(event.comprovante!).catch(() => undefined)}
                >
                  Abrir comprovante
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
