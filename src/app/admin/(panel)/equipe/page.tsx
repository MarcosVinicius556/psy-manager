"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { toast } from "react-toastify";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import { useAuth } from "@/lib/admin/auth-context";
import { getFirebaseDb } from "@/lib/admin/firebase";
import { useClinic } from "@/lib/admin/clinic-context";
import { Card, PageTitle } from "@/components/admin/ui";
import { useWorkspace } from "@/lib/team/workspace-context";
import type { StaffMember } from "@/lib/team/types";

export default function EquipeSecretariasPage() {
  const { user } = useAuth();
  const { members } = useClinic();
  const { workspace } = useWorkspace();
  const me = members.find((member) => member.uid === user?.uid);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const canManage = workspace?.kind === "owner";

  useEffect(() => {
    if (!user || !canManage) {
      setLoading(false);
      return;
    }
    getDocs(query(collection(getFirebaseDb(), "staffMembers"), where("ownerUid", "==", user.uid)))
      .then((snap) => {
        setStaff(
          snap.docs.map((doc) => ({
            ...(doc.data() as StaffMember),
            id: doc.id,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [user, canManage]);

  async function invite() {
    if (!email.trim()) return;
    try {
      const headers = await authorizedHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/team/staff/invite", {
        method: "POST",
        headers,
        body: JSON.stringify({ inviteeEmail: email, inviteeNome: nome, ownerNome: me?.nome || "Profissional" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível enviar o convite.");
      toast.success(data.emailSent ? "Convite enviado por e-mail." : `Convite criado: ${data.link}`);
      setEmail("");
      setNome("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao convidar.");
    }
  }

  async function revoke(staffUid: string) {
    try {
      const headers = await authorizedHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/team/staff/revoke", {
        method: "POST",
        headers,
        body: JSON.stringify({ staffUid }),
      });
      if (!response.ok) throw new Error("Não foi possível revogar.");
      toast.success("Acesso revogado. O token será atualizado em até 1 hora ou após novo login.");
      setStaff((current) => current.map((item) => (item.staffUid === staffUid ? { ...item, ativo: false } : item)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao revogar.");
    }
  }

  if (!canManage) {
    return (
      <div className="space-y-4">
        <PageTitle title="Equipe" subtitle="Você está conectada como secretária." />
        <Card className="p-4 text-sm text-muted">
          Agenda, pacientes e financeiro do consultório de {workspace?.tenantOwnerUid}. Rotas clínicas permanecem ocultas.
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Secretárias" subtitle="Convide assistentes com acesso administrativo, sem prontuário." />
      <Card className="space-y-4 p-4">
        <h2 className="text-sm font-semibold text-ink">Novo convite</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-control border border-[var(--color-border-subtle)] px-3 py-2 text-sm"
            placeholder="E-mail da secretária"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="rounded-control border border-[var(--color-border-subtle)] px-3 py-2 text-sm"
            placeholder="Nome (opcional)"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
          />
        </div>
        <button type="button" className="btn-primary" onClick={invite}>
          Enviar convite
        </button>
      </Card>
      <Card className="divide-y divide-[var(--color-border-subtle)]">
        {loading ? <p className="p-4 text-sm text-muted">Carregando…</p> : null}
        {!loading && staff.length === 0 ? <p className="p-4 text-sm text-muted">Nenhuma secretária vinculada.</p> : null}
        {staff.map((member) => (
          <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium text-ink">{member.nome}</p>
              <p className="text-sm text-muted">{member.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">{member.ativo ? "Ativa" : "Revogada"}</span>
              {member.ativo ? (
                <button type="button" className="btn-text" onClick={() => revoke(member.staffUid)}>
                  Revogar
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
