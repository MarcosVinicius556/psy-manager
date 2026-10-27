"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card } from "@/components/admin/ui";
import { SATEPSI_CFP_NOTE } from "@/lib/scales/catalog";
import type { Patient } from "@/lib/admin/types";
import { useAuth } from "@/lib/admin/auth-context";

type Insights = {
  journal: { id: string; dia: string; humor: string; texto: string; updatedAt: string }[];
  scaleSeries: Record<string, { submittedAt: string; pontuacao: number; faixa: string }[]>;
};

export default function PatientPortalPanel({ patient }: { patient: Patient }) {
  const { user } = useAuth();
  const [portalAtivo, setPortalAtivo] = useState(Boolean(patient.portalAtivo));
  const [inviteLink, setInviteLink] = useState("");
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkCodeShareUrl, setLinkCodeShareUrl] = useState("");
  const [linkCodeExpires, setLinkCodeExpires] = useState("");
  const [portalLinked, setPortalLinked] = useState(Boolean(patient.patientAuthUid));
  const [insights, setInsights] = useState<Insights | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [muralText, setMuralText] = useState("");
  const [commentEntryId, setCommentEntryId] = useState("");
  const [commentText, setCommentText] = useState("");

  const authHeaders = useCallback(async () => {
    const idToken = await user?.getIdToken();
    return { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" };
  }, [user]);

  const loadInsights = useCallback(async () => {
    if (!user || !portalAtivo) return;
    const headers = await authHeaders();
    const res = await fetch(`/api/patient-portal/insights?patientId=${patient.id}`, { headers });
    if (!res.ok) return;
    setInsights(await res.json());
  }, [authHeaders, patient.id, portalAtivo, user]);

  useEffect(() => {
    setPortalAtivo(Boolean(patient.portalAtivo));
    setPortalLinked(Boolean(patient.patientAuthUid));
  }, [patient.portalAtivo, patient.patientAuthUid]);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  async function togglePortal(next: boolean) {
    const headers = await authHeaders();
    const res = await fetch("/api/patient-portal/settings", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ patientId: patient.id, portalAtivo: next }),
    });
    if (!res.ok) {
      toast.error("Não foi possível atualizar o portal.");
      return;
    }
    setPortalAtivo(next);
    toast.success(next ? "Portal ativado." : "Portal desativado.");
  }

  async function generateLinkCode() {
    const headers = await authHeaders();
    const res = await fetch("/api/patient-portal/link-code", {
      method: "POST",
      headers,
      body: JSON.stringify({ patientId: patient.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error("Não foi possível gerar o código.");
      return;
    }
    setLinkCode(data.code);
    setLinkCodeShareUrl(data.link);
    setLinkCodeExpires(data.expiresAt);
    toast.success("Código de vínculo gerado.");
  }

  async function revokeLinkCode() {
    const headers = await authHeaders();
    const res = await fetch("/api/patient-portal/link-code", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ patientId: patient.id }),
    });
    if (!res.ok) {
      toast.error("Não foi possível revogar.");
      return;
    }
    setLinkCode(null);
    setLinkCodeShareUrl("");
    toast.success("Códigos pendentes revogados.");
  }

  async function unlinkPortalAccount() {
    if (!window.confirm("Desvincular a conta do portal deste paciente?")) return;
    const headers = await authHeaders();
    const res = await fetch("/api/patient-portal/unlink-account", {
      method: "POST",
      headers,
      body: JSON.stringify({ patientId: patient.id }),
    });
    if (!res.ok) {
      toast.error("Não foi possível desvincular.");
      return;
    }
    setPortalLinked(false);
    toast.success("Conta do portal desvinculada.");
  }

  async function createInvite() {
    const headers = await authHeaders();
    const res = await fetch("/api/patient-portal/invite", {
      method: "POST",
      headers,
      body: JSON.stringify({ patientId: patient.id, email: patient.email }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error("Não foi possível gerar o convite.");
      return;
    }
    const absolute = `${window.location.origin}${data.link}`;
    setInviteLink(absolute);
    toast.success("Link de convite gerado.");
  }

  async function postTask() {
    if (!taskTitle.trim()) return;
    const headers = await authHeaders();
    const res = await fetch("/api/patient-portal/tasks", {
      method: "POST",
      headers,
      body: JSON.stringify({ patientId: patient.id, titulo: taskTitle }),
    });
    if (!res.ok) toast.error("Falha ao criar tarefa.");
    else {
      toast.success("Tarefa enviada.");
      setTaskTitle("");
    }
  }

  async function postMural() {
    if (!muralText.trim()) return;
    const headers = await authHeaders();
    const res = await fetch("/api/patient-portal/mural", {
      method: "POST",
      headers,
      body: JSON.stringify({ patientId: patient.id, texto: muralText }),
    });
    if (!res.ok) toast.error("Falha ao publicar no mural.");
    else {
      toast.success("Mensagem publicada.");
      setMuralText("");
    }
  }

  async function postComment() {
    if (!commentEntryId || !commentText.trim()) return;
    const headers = await authHeaders();
    const res = await fetch("/api/patient-portal/journal-comment", {
      method: "POST",
      headers,
      body: JSON.stringify({ entryId: commentEntryId, texto: commentText }),
    });
    if (!res.ok) toast.error("Não foi possível comentar.");
    else {
      toast.success("Comentário salvo.");
      setCommentText("");
      void loadInsights();
    }
  }

  return (
    <Card className="mb-6">
      <h2 className="mb-2 text-2xl font-medium text-teal">Portal do paciente</h2>
      <p className="mb-4 text-sm text-muted">
        O paciente pode criar conta em <code className="text-ink">/paciente</code> e vincular-se com código, convite ou e-mail. Não acessa prontuário.
      </p>
      {portalLinked && (
        <p className="mb-3 text-sm text-teal">Conta do portal vinculada a este prontuário.</p>
      )}
      <label className="mb-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={portalAtivo} onChange={(e) => void togglePortal(e.target.checked)} />
        Portal ativo para este paciente
      </label>
      {portalAtivo && (
        <div className="space-y-4">
          <div className="mb-4 space-y-2 rounded-surface border border-[var(--color-border-subtle)] p-3">
            <h3 className="font-medium text-teal">Código de vínculo</h3>
            <p className="text-xs text-muted">Código de uso único, válido por 7 dias. Compartilhe com o paciente.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={() => void generateLinkCode()}>
                Gerar código de vínculo
              </button>
              <button type="button" className="btn-text" onClick={() => void revokeLinkCode()}>
                Revogar pendentes
              </button>
              {portalLinked && (
                <button type="button" className="btn-text text-accent" onClick={() => void unlinkPortalAccount()}>
                  Desvincular conta do portal
                </button>
              )}
            </div>
            {linkCode && (
              <div className="text-sm">
                <p className="font-medium">Código: {linkCode}</p>
                <p className="text-xs text-muted">Expira em {linkCodeExpires?.slice(0, 10)}</p>
                {linkCodeShareUrl && (
                  <button type="button" className="btn-text mt-1 text-xs" onClick={() => navigator.clipboard.writeText(linkCodeShareUrl)}>
                    Copiar link com código
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={() => void createInvite()}>
              Gerar link de convite
            </button>
            {inviteLink && (
              <button type="button" className="btn-text" onClick={() => navigator.clipboard.writeText(inviteLink)}>
                Copiar convite
              </button>
            )}
          </div>
          {inviteLink && <p className="break-all text-xs text-muted">{inviteLink}</p>}

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-medium text-teal">Tarefa de casa</h3>
              <input
                className="field mb-2 w-full"
                placeholder="Ex.: Registrar situações de ansiedade"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
              <button type="button" className="btn-row" onClick={() => void postTask()}>
                Enviar tarefa
              </button>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-teal">Mural</h3>
              <textarea
                className="field mb-2 w-full min-h-20"
                placeholder="Mensagem curta para o paciente"
                value={muralText}
                onChange={(e) => setMuralText(e.target.value)}
              />
              <button type="button" className="btn-row" onClick={() => void postMural()}>
                Publicar
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-medium text-teal">Diário compartilhado</h3>
            {insights?.journal.length ? (
              <ul className="mb-3 space-y-3">
                {insights.journal.slice(0, 8).map((entry) => (
                  <li key={entry.id} className="rounded-surface border border-[var(--color-border-subtle)] p-3 text-sm">
                    <p className="font-medium">{entry.dia} · {entry.humor || "—"}</p>
                    <p className="text-muted">{entry.texto || "Sem texto"}</p>
                    <button type="button" className="btn-text mt-2 text-xs" onClick={() => setCommentEntryId(entry.id)}>
                      Comentar
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Nenhum registro compartilhado ainda.</p>
            )}
            {commentEntryId && (
              <div className="mt-2">
                <textarea className="field mb-2 w-full min-h-16" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                <button type="button" className="btn-row" onClick={() => void postComment()}>
                  Salvar comentário
                </button>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 font-medium text-teal">Escalas (PHQ-9 / GAD-7)</h3>
            <p className="mb-2 text-xs text-muted">{SATEPSI_CFP_NOTE}</p>
            {insights &&
              Object.entries(insights.scaleSeries).map(([id, points]) => (
                <div key={id} className="mb-3 text-sm">
                  <p className="font-medium">{id}</p>
                  {points.length === 0 ? (
                    <p className="text-muted">Sem respostas.</p>
                  ) : (
                    <ul className="text-muted">
                      {points.map((p) => (
                        <li key={p.submittedAt}>
                          {p.submittedAt.slice(0, 10)} — {p.pontuacao} ({p.faixa})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
}
