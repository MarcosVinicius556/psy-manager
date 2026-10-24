"use client";

import { hasUnresolvedLegalPlaceholders } from "@/lib/legal/config";

export default function LegalPlaceholderBanner() {
  if (process.env.NODE_ENV === "production") return null;
  if (!hasUnresolvedLegalPlaceholders()) return null;
  return (
    <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="status">
      Alguns dados cadastrais do controlador ainda usam placeholders ({"{{RAZAO_SOCIAL}}"}, etc.). Preencha{" "}
      <code className="rounded bg-white/80 px-1">src/lib/legal/config.ts</code> antes do lançamento comercial.
    </div>
  );
}
