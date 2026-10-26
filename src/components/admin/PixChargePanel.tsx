"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { toast } from "react-toastify";
import { useClinic } from "@/lib/admin/clinic-context";
import { remainingAmount } from "@/lib/admin/finance";
import { formatMoney } from "@/lib/admin/format";
import { buildPaymentPixBrcode } from "@/lib/pix/build-charge";
import type { ClinicMember, Payment } from "@/lib/admin/types";
import FileAttachments from "./FileAttachments";
import type { ClinicAttachment } from "@/lib/admin/types";

type Props = {
  payment: Payment;
  member: ClinicMember | null | undefined;
  compact?: boolean;
};

export default function PixChargePanel({ payment, member, compact }: Props) {
  const { updatePaymentComprovantePaciente } = useClinic();
  const remaining = remainingAmount(payment);
  const open = remaining > 0 && payment.status !== "nao_pago";
  const brcode = useMemo(() => (member && open ? buildPaymentPixBrcode(member, payment) : null), [member, open, payment]);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!brcode || !brcode.ok) {
      setQrDataUrl("");
      return;
    }
    void QRCode.toDataURL(brcode.code, { margin: 1, width: compact ? 160 : 220 }).then(setQrDataUrl);
  }, [brcode, compact]);

  if (!open) return null;

  if (!brcode?.ok) {
    return (
      <div className="rounded-surface border border-[var(--color-border-subtle)] bg-paper px-4 py-3 text-sm text-muted">
        <p>{brcode?.reason || "Cadastre sua chave Pix em Configurações para gerar o QR Code."}</p>
        <Link href="/admin/configuracoes" className="btn-text mt-2 inline-flex">
          Ir para Configurações
        </Link>
      </div>
    );
  }

  async function copyCode() {
    if (!brcode?.ok) return;
    try {
      await navigator.clipboard.writeText(brcode.code);
      toast.success("Pix copia e cola copiado.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o código manualmente.");
    }
  }

  async function onComprovante(files: ClinicAttachment[]) {
    const file = files[0] ?? null;
    setUploading(true);
    try {
      await updatePaymentComprovantePaciente(payment.id, file);
      toast.success(file ? "Comprovante do paciente salvo." : "Comprovante removido.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o comprovante.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-4 rounded-surface border border-[var(--color-border-subtle)] bg-paper p-4">
      <div>
        <p className="text-sm font-semibold text-teal">Pix copia e cola</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          QR estático com a chave do profissional. O banco não avisa quando o pagamento cai — confirme manualmente após o paciente pagar.
        </p>
      </div>
      <div className={`grid gap-4 ${compact ? "" : "sm:grid-cols-[auto,1fr]"}`}>
        {qrDataUrl ? (
          <Image src={qrDataUrl} alt="QR Code Pix" width={compact ? 160 : 220} height={compact ? 160 : 220} className="rounded-control border border-[var(--color-border-subtle)] bg-white" unoptimized />
        ) : null}
        <div className="grid gap-2">
          <p className="text-sm text-muted">
            Valor: <strong className="text-ink">{formatMoney(brcode.amount)}</strong>
          </p>
          <textarea
            readOnly
            className="min-h-[88px] w-full rounded-control border border-[var(--color-border-subtle)] bg-white px-3 py-2 font-mono text-xs text-ink"
            value={brcode.code}
            aria-label="Código Pix copia e cola"
          />
          <button type="button" className="btn-row justify-self-start" onClick={() => void copyCode()}>
            Copiar Pix
          </button>
        </div>
      </div>
      <FileAttachments
        label="Comprovante do paciente"
        description="Anexe o comprovante enviado pelo paciente (WhatsApp, e-mail etc.)."
        files={payment.comprovantePaciente ? [payment.comprovantePaciente] : []}
        onChange={(files) => void onComprovante(files)}
        uploadTarget={{ kind: "payment-receipt", paymentId: payment.id }}
        kind="documento"
        multiple={false}
        onBusy={setUploading}
      />
      {uploading ? <p className="text-xs text-muted">Enviando arquivo...</p> : null}
    </div>
  );
}
