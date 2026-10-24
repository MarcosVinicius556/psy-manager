"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useClinic } from "@/lib/admin/clinic-context";
import { canIssueFiscalReceipt } from "@/lib/admin/receipt-fiscal";
import { openClinicPdf } from "@/lib/admin/reports";
import type { Payment } from "@/lib/admin/types";

export default function PaymentFiscalReceipt({ payment, compact }: { payment: Payment; compact?: boolean }) {
  const { issueFiscalReceipt } = useClinic();
  const [busy, setBusy] = useState(false);
  const issued = payment.reciboFiscal;
  const eligible = canIssueFiscalReceipt(payment) && payment.origem === "paciente";

  async function onGenerate(replace = false) {
    setBusy(true);
    try {
      await issueFiscalReceipt(payment.id, { replace });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o recibo.");
    } finally {
      setBusy(false);
    }
  }

  async function onOpen() {
    if (!issued?.arquivo.url) return;
    setBusy(true);
    try {
      await openClinicPdf(issued.arquivo.url, issued.arquivo.nome);
    } catch {
      toast.error("Não foi possível abrir o recibo.");
    } finally {
      setBusy(false);
    }
  }

  if (!eligible && !issued) return null;

  const className = compact ? "btn-text text-xs" : "btn-text";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {issued ? (
        <>
          <button type="button" className={className} disabled={busy} onClick={() => void onOpen()}>
            Recibo nº {String(issued.numero).padStart(4, "0")}
          </button>
          <button type="button" className={className} disabled={busy} onClick={() => void onGenerate(true)}>
            Gerar de novo
          </button>
        </>
      ) : (
        <button type="button" className={compact ? "btn-row text-xs" : "btn-row"} disabled={busy || !eligible} onClick={() => void onGenerate(false)}>
          {busy ? "Gerando..." : "Emitir recibo PDF"}
        </button>
      )}
    </div>
  );
}
