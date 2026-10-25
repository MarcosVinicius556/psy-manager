"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { toast } from "react-toastify";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import type { EmailIntegrationPublic } from "@/lib/email-integration/types";
import type { TemplateRenderContext } from "@/lib/email-integration/types";
import { Field, fieldClass } from "./ui";

type AttachmentPayload = { filename: string; contentType: string; contentBase64: string };

export default function EmailSendPreviewModal({
  open,
  onClose,
  title,
  subject,
  corpo,
  context,
  defaultTo,
  templateId,
  templateNome,
  patientId,
  paymentId,
  relatedType,
  relatedId,
  attachments = [],
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subject: string;
  corpo: string;
  context: TemplateRenderContext;
  defaultTo: string;
  templateId?: string;
  templateNome?: string;
  patientId?: string;
  paymentId?: string;
  relatedType?: string;
  relatedId?: string;
  attachments?: AttachmentPayload[];
}) {
  const [integration, setIntegration] = useState<EmailIntegrationPublic | null>(null);
  const [to, setTo] = useState(defaultTo);
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewBody, setPreviewBody] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTo(defaultTo);
  }, [open, defaultTo]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      try {
        const headers = await authorizedHeaders();
        const statusRes = await fetch("/api/integrations/email", { headers });
        const status = (await statusRes.json()) as EmailIntegrationPublic;
        if (active) setIntegration(status);
      } catch {
        if (active) setIntegration(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingPreview(true);
    (async () => {
      try {
        const headers = await authorizedHeaders({ "Content-Type": "application/json" });
        const response = await fetch("/api/email/preview", {
          method: "POST",
          headers,
          body: JSON.stringify({ subject, corpo, context, to }),
        });
        const data = (await response.json()) as { subject?: string; body?: string };
        if (active) {
          setPreviewSubject(data.subject || "");
          setPreviewBody(data.body || "");
        }
      } catch {
        if (active) {
          setPreviewSubject("");
          setPreviewBody("");
        }
      } finally {
        if (active) setLoadingPreview(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, subject, corpo, context, to]);

  async function send() {
    setSending(true);
    try {
      const headers = await authorizedHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers,
        body: JSON.stringify({
          to,
          subject,
          corpo,
          context,
          attachments,
          templateId,
          templateNome,
          patientId,
          paymentId,
          relatedType,
          relatedId,
        }),
      });
      const data = (await response.json()) as { sent?: boolean; reason?: string };
      if (!response.ok || !data.sent) throw new Error(data.reason || "falha");
      toast.success("E-mail enviado.");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o e-mail.");
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  const connected = Boolean(integration?.provider && integration.connectedAddress);

  return createPortal(
    <div className="sheet-host fixed inset-0 z-[90] grid place-items-center bg-ink/40 p-4">
      <div
        className="sheet-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-surface)] bg-white p-5 shadow-[0_18px_50px_rgba(61,82,64,0.18)] sm:p-6"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">E-mail</p>
            <h2 className="mt-1 font-serif text-[clamp(1.5rem,5vw,1.875rem)] leading-tight text-teal">{title}</h2>
          </div>
          <button type="button" className="btn-text" onClick={onClose}>
            Fechar
          </button>
        </div>

        {!connected ? (
          <div className="grid gap-3">
            <p className="text-sm text-muted">Configure o envio de e-mails em Configurações para habilitar esta ação.</p>
            <Link href="/admin/configuracoes" className="btn-primary justify-self-start">
              Ir para Configurações → E-mail
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            <Field label="Destinatário">
              <input type="email" className={fieldClass} value={to} onChange={(event) => setTo(event.target.value)} required />
            </Field>
            <div>
              <p className="text-sm font-medium text-ink">Assunto</p>
              <p className="mt-1 rounded-[var(--radius-control)] border border-leaf bg-paper px-3 py-2 text-sm text-ink">
                {loadingPreview ? "Gerando prévia..." : previewSubject}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Mensagem</p>
              <pre className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-[var(--radius-control)] border border-leaf bg-paper px-3 py-2 text-sm text-ink">
                {loadingPreview ? "Gerando prévia..." : previewBody}
              </pre>
            </div>
            {attachments.length > 0 ? (
              <p className="text-sm text-muted">
                Anexos: {attachments.map((item) => item.filename).join(", ")}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary" disabled={sending || loadingPreview || !to.trim()} onClick={() => void send()}>
                {sending ? "Enviando..." : "Enviar e-mail"}
              </button>
              <button type="button" className="btn-text" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
