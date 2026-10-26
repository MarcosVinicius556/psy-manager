"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { authorizedHeaders } from "@/lib/admin/api-auth";
import { Card, PageTitle } from "@/components/admin/ui";
import { getFirebaseAuth } from "@/lib/admin/firebase";
import { useWorkspace } from "@/lib/team/workspace-context";

export default function LocationClinicInviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { refreshClaims } = useWorkspace();
  const [busy, setBusy] = useState(false);

  async function accept() {
    setBusy(true);
    try {
      const headers = await authorizedHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/team/clinic/accept", {
        method: "POST",
        headers,
        body: JSON.stringify({ token: params.token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.reason || "Convite inválido.");
      await getFirebaseAuth().currentUser?.getIdToken(true);
      await refreshClaims();
      toast.success("Você entrou no local.");
      const target = data.locationId ? `/admin/locais/${data.locationId}` : "/admin/locais";
      router.replace(target);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível aceitar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageTitle title="Convite para local" subtitle="Seus dados clínicos continuam visíveis apenas para você." />
      <Card className="p-4">
        <button type="button" className="btn-primary" disabled={busy} onClick={accept}>
          {busy ? "Confirmando…" : "Aceitar convite"}
        </button>
      </Card>
    </div>
  );
}
