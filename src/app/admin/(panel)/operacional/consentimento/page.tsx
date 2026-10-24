"use client";

import Link from "next/link";
import { TCLE_TEMPLATE } from "@/lib/admin/tcle";

function downloadTemplate() {
  const blob = new Blob([TCLE_TEMPLATE], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "tcle-psy-manager-modelo.txt";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function PatientConsentTemplatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-teal">Modelo de Termo de Consentimento (TCLE)</h1>
        <p className="mt-2 text-sm text-muted">
          Modelo para uso da psicóloga com pacientes sobre tratamento de dados e atendimento por TIC. Substitua os placeholders antes de imprimir ou assinar.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={downloadTemplate} className="btn-primary">
          Baixar modelo (.txt)
        </button>
        <Link href="/privacidade" className="btn-text">
          Política de Privacidade
        </Link>
      </div>
      <pre className="rounded-2xl border border-[#d7e0d8] bg-white p-4 text-xs leading-relaxed text-muted whitespace-pre-wrap break-words">
        {TCLE_TEMPLATE}
      </pre>
    </div>
  );
}
