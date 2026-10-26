"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { buildAccountExportZip, downloadBlob } from "@/lib/account/data-export";
import { useAuth } from "@/lib/admin/auth-context";

export default function AccountDataExport() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");

  async function exportData() {
    if (!user?.uid) return;
    setBusy(true);
    setPhase("Iniciando…");
    try {
      const blob = await buildAccountExportZip(user.uid, (progress) => setPhase(progress.phase));
      const stamp = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `psy-manager-export-${stamp}.zip`);
      toast.success("Exportação concluída.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível exportar.");
    } finally {
      setBusy(false);
      setPhase("");
    }
  }

  return (
    <div className="rounded-md bg-paper p-4 text-sm">
      <p className="font-medium text-teal">Exportar meus dados</p>
      <p className="mt-2 text-muted">
        Gera um ZIP com pacientes, sessões, pagamentos e prontuários em JSON e CSV — portabilidade LGPD (art. 18). O arquivo fica só no seu dispositivo.
      </p>
      {phase ? <p className="mt-2 text-xs text-muted" aria-live="polite">{phase}</p> : null}
      <button type="button" className="btn-primary mt-4" disabled={busy} onClick={() => void exportData()}>
        {busy ? "Exportando…" : "Exportar meus dados"}
      </button>
    </div>
  );
}
