"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import type { SessionFeedback } from "@/lib/admin/types";

export function feedbackLink(token: string) {
  return `${window.location.origin}/feedback/${token}`;
}

export function feedbackAvailability(feedback: SessionFeedback) {
  if (feedback.answeredAt) return "respondido";
  if (Date.parse(feedback.expiresAt) <= Date.now()) return "expirado";
  return "aberto";
}

export default function FeedbackShare({
  feedback,
  patientEmail = "",
}: {
  feedback: SessionFeedback;
  patientEmail?: string;
}) {
  const availability = feedbackAvailability(feedback);
  const [sending, setSending] = useState(false);
  const link = feedbackLink(feedback.id);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  async function sendEmail() {
    setSending(true);
    try {
      const headers = await authorizedHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/session-feedback", {
        method: "POST",
        headers,
        body: JSON.stringify({ feedbackId: feedback.id }),
      });
      if (!response.ok) throw new Error("Falha no envio");
      toast.success("E-mail enviado ao paciente.");
    } catch {
      toast.error("Não foi possível enviar o e-mail.");
    } finally {
      setSending(false);
    }
  }

  if (availability === "respondido") {
    const stars = feedback.stars || 0;
    return (
      <div className="grid gap-2">
        <p className="text-lg font-medium text-teal" aria-label={`${stars} de 5`}>
          {"★".repeat(stars)}
          <span className="text-muted">{"★".repeat(Math.max(0, 5 - stars))}</span>
          <span className="ml-2 text-sm font-normal text-ink">{stars} de 5</span>
        </p>
        <p className="text-sm text-ink">{feedback.comment.trim() || "O paciente não escreveu um comentário."}</p>
      </div>
    );
  }
  if (availability === "expirado") {
    return <p className="text-sm text-muted">O link expirou depois de 48 horas e não foi respondido.</p>;
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted">
        O link vale por 48 horas e aceita uma única resposta. Depois disso ele deixa de abrir.
      </p>
      <input className="rounded-md border border-leaf bg-paper px-3 py-2 text-sm" readOnly value={link} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={copy}>
          Copiar link
        </button>
        <button type="button" className="btn-row" disabled={sending || !patientEmail.trim()} onClick={sendEmail}>
          {sending ? "Enviando..." : "Enviar por e-mail"}
        </button>
      </div>
      {!patientEmail.trim() && <p className="text-sm text-muted">Este paciente não tem e-mail no cadastro. Copie o link e encaminhe manualmente.</p>}
    </div>
  );
}
