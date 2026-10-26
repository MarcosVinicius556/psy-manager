export type ExportProgress = { phase: string; done: number; total: number | null };

export async function buildAccountExportZip(
  _ownerUid: string,
  onProgress?: (progress: ExportProgress) => void
) {
  const { authorizedHeaders } = await import("@/lib/admin/api-auth");
  report(onProgress, "Pacientes", 0, null);
  const headers = await authorizedHeaders();
  report(onProgress, "Sessões", 0, null);
  report(onProgress, "Financeiro", 0, null);
  report(onProgress, "Prontuários", 0, null);

  const response = await fetch("/api/account/data-export", { headers });
  if (response.status === 403) {
    throw new Error("A exportação completa de dados clínicos é permitida apenas ao titular da conta.");
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { reason?: string };
    throw new Error(payload.reason || "Não foi possível exportar os dados.");
  }

  report(onProgress, "Compactando", 1, 1);
  const buffer = await response.arrayBuffer();
  return new Blob([buffer], { type: "application/zip" });
}

function report(onProgress?: (progress: ExportProgress) => void, phase?: string, done?: number, total?: number | null) {
  if (phase != null) onProgress?.({ phase, done: done ?? 0, total: total ?? null });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
