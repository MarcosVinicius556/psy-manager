"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/admin/auth-context";
import { LEGAL_DOCUMENTS } from "@/lib/legal/config";
import { fetchUserLegalAcceptances, pendingLegalDocuments, submitLegalAcceptances } from "@/lib/legal/client";

const labels = {
  termos: "Termos de Uso",
  privacidade: "Política de Privacidade",
  dpa: "Acordo de Tratamento de Dados (DPA)",
} as const;

export default function LegalReacceptModal() {
  const { user } = useAuth();
  const [pending, setPending] = useState<("termos" | "privacidade" | "dpa")[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchUserLegalAcceptances(user.uid)
      .then(({ latest }) => {
        if (!active) return;
        const need = pendingLegalDocuments(latest, { requireDpa: true });
        setPending(need);
        setChecked({});
      })
      .catch(() => {
        if (active) setPending([]);
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (!user || pending.length === 0) return null;

  const allChecked = pending.every((doc) => checked[doc]);

  async function onConfirm() {
    if (!allChecked) return;
    setBusy(true);
    setError("");
    try {
      await submitLegalAcceptances(pending);
      setPending([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar o aceite.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1200] grid place-items-center bg-ink/50 p-4" role="dialog" aria-modal="true" aria-labelledby="legal-reaccept-title">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
        <h2 id="legal-reaccept-title" className="font-serif text-2xl text-teal">Atualização dos documentos legais</h2>
        <p className="mt-2 text-sm text-muted">
          Há uma nova versão dos documentos abaixo. Para continuar usando o painel, leia e confirme o aceite.
        </p>
        <ul className="mt-4 space-y-3 text-sm">
          {pending.map((doc) => (
            <li key={doc} className="rounded-2xl border border-[#e7eee8] p-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 size-5 accent-teal"
                  checked={Boolean(checked[doc])}
                  onChange={(event) => setChecked((current) => ({ ...current, [doc]: event.target.checked }))}
                />
                <span>
                  Li e aceito a versão {LEGAL_DOCUMENTS[doc].version} dos{" "}
                  <Link href={LEGAL_DOCUMENTS[doc].path} className="font-semibold text-teal underline underline-offset-2" target="_blank">
                    {labels[doc]}
                  </Link>
                  .
                </span>
              </label>
            </li>
          ))}
        </ul>
        {error ? <p className="mt-3 text-sm text-accent" role="status">{error}</p> : null}
        <button
          type="button"
          disabled={!allChecked || busy}
          className="mt-5 h-12 w-full rounded-full bg-teal text-sm font-semibold text-white disabled:opacity-50"
          onClick={onConfirm}
        >
          {busy ? "Salvando…" : "Confirmar e continuar"}
        </button>
      </div>
    </div>
  );
}
