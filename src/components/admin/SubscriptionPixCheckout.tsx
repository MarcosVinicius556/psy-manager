"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { toast } from "react-toastify";
import { getFirebaseAuth } from "@/lib/admin/firebase";
import { formatPublicPrice, PUBLIC_BILLING } from "@/lib/billing/plans";
import { reportSubscriptionPixPaid, requestCheckout } from "@/lib/saas/account-store";
import type { AccountRecord } from "@/lib/saas/model";

type PixPayload = {
  code: string;
  txid: string;
  amountCents: number;
  configured: boolean;
  devPlaceholder: boolean;
};

type Props = {
  account: AccountRecord;
  onUpdated: () => Promise<void>;
};

export default function SubscriptionPixCheckout({ account, onUpdated }: Props) {
  const [planId, setPlanId] = useState<"consultorio" | "consultorio_anual">(
    account.checkoutPlanId === "consultorio_anual" ? "consultorio_anual" : "consultorio"
  );
  const [busy, setBusy] = useState("");
  const [pix, setPix] = useState<PixPayload | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const loadPix = useCallback(async () => {
    const user = getFirebaseAuth().currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    const response = await fetch(`/api/billing/subscription/checkout-pix?planId=${encodeURIComponent(planId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await response.json()) as PixPayload & { ok?: boolean; reason?: string };
    if (!response.ok || !data.ok) {
      setPix(null);
      return;
    }
    setPix({
      code: data.code,
      txid: data.txid,
      amountCents: data.amountCents,
      configured: data.configured,
      devPlaceholder: data.devPlaceholder,
    });
  }, [planId]);

  useEffect(() => {
    if (account.checkoutStatus === "aguardando_confirmacao_pix") {
      void loadPix();
    }
  }, [account.checkoutStatus, account.checkoutPlanId, loadPix]);

  useEffect(() => {
    if (!pix?.code) {
      setQrDataUrl("");
      return;
    }
    void QRCode.toDataURL(pix.code, { margin: 1, width: 220 }).then(setQrDataUrl);
  }, [pix?.code]);

  async function startCheckout() {
    setBusy("checkout");
    try {
      await requestCheckout(account, planId);
      await onUpdated();
      await loadPix();
      toast.success("Pix gerado. Pague e clique em “Já paguei” quando concluir.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível iniciar a contratação.");
    } finally {
      setBusy("");
    }
  }

  async function markPaid() {
    setBusy("paid");
    try {
      const user = getFirebaseAuth().currentUser;
      if (!user) throw new Error("Entre novamente para continuar.");
      const token = await user.getIdToken();
      await reportSubscriptionPixPaid(token);
      toast.success("Pagamento informado. Aguarde a confirmação na plataforma.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar.");
    } finally {
      setBusy("");
    }
  }

  async function copyCode() {
    if (!pix?.code) return;
    try {
      await navigator.clipboard.writeText(pix.code);
      toast.success("Pix copia e cola copiado.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  const awaiting = account.checkoutStatus === "aguardando_confirmacao_pix";
  const amountLabel =
    planId === "consultorio_anual"
      ? formatPublicPrice(PUBLIC_BILLING.annualCents)
      : formatPublicPrice(PUBLIC_BILLING.monthlyCents);

  return (
    <div className="mt-4 rounded-md border border-[var(--color-border-subtle)] bg-paper p-4">
      <h3 className="text-lg font-semibold text-teal">Assinatura por Pix</h3>
      <p className="mt-1 text-sm text-muted">
        Escolha mensal ou anual, pague o Pix da plataforma e informe o pagamento. A confirmação é manual — sem taxa de gateway.
      </p>
      {!awaiting && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn-chip ${planId === "consultorio" ? "ring-2 ring-teal" : ""}`}
            onClick={() => setPlanId("consultorio")}
          >
            Mensal {formatPublicPrice(PUBLIC_BILLING.monthlyCents)}
          </button>
          <button
            type="button"
            className={`btn-chip ${planId === "consultorio_anual" ? "ring-2 ring-teal" : ""}`}
            onClick={() => setPlanId("consultorio_anual")}
          >
            Anual {formatPublicPrice(PUBLIC_BILLING.annualCents)}
          </button>
        </div>
      )}
      {!awaiting && (
        <button type="button" className="btn-primary mt-4" disabled={busy === "checkout"} onClick={() => void startCheckout()}>
          Gerar Pix para {amountLabel}
        </button>
      )}
      {awaiting && pix && (
        <div className="mt-4 grid gap-3">
          {!pix.configured && (
            <p className="rounded-md bg-white px-3 py-2 text-sm text-muted">
              Pix em configuração no servidor{pix.devPlaceholder ? " (chave de desenvolvimento)" : ""}. Em produção, defina{" "}
              <code className="text-xs">PSY_BILLING_PIX_KEY</code>.
            </p>
          )}
          <p className="text-sm">
            Valor: <strong>{formatPublicPrice(pix.amountCents)}</strong> · TxID: <span className="font-mono text-xs">{pix.txid}</span>
          </p>
          {qrDataUrl && (
            <Image src={qrDataUrl} alt="QR Code Pix assinatura" width={220} height={220} className="rounded-md border" unoptimized />
          )}
          <textarea readOnly className="w-full rounded-control border border-[var(--color-border-subtle)] p-2 font-mono text-xs" rows={4} value={pix.code} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-chip" onClick={() => void copyCode()}>Copiar Pix</button>
            <button type="button" className="btn-primary" disabled={busy === "paid"} onClick={() => void markPaid()}>
              Já paguei
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
