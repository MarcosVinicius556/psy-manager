"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import { useWorkspace } from "@/lib/team/workspace-context";
import { Card, PageTitle } from "@/components/admin/ui";
import { getFirebaseAuth } from "@/lib/admin/firebase";

export default function StaffInviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { refreshClaims } = useWorkspace();
  const [busy, setBusy] = useState(false);

  async function accept() {
    setBusy(true);
    try {
      const headers = await authorizedHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/team/staff/accept", {
        method: "POST",
        headers,
        body: JSON.stringify({ token: params.token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.reason || data.error || "Convite inválido.");
      await getFirebaseAuth().currentUser?.getIdToken(true);
      await refreshClaims();
      toast.success("Convite aceito. Bem-vinda ao painel administrativo.");
      router.replace("/admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível aceitar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageTitle title="Convite de secretária" subtitle="Você terá acesso à agenda, cadastro e financeiro, sem prontuário." />
      <Card className="space-y-4 p-4">
        <p className="text-sm text-muted">
          Ao aceitar, você concorda em manter sigilo sobre dados sensíveis e não tentar acessar evoluções clínicas.
        </p>
        <button type="button" className="btn-primary" disabled={busy} onClick={accept}>
          {busy ? "Confirmando…" : "Aceitar convite"}
        </button>
      </Card>
    </div>
  );
}
