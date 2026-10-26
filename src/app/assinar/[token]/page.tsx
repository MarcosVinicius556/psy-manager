"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import { fieldClass } from "@/components/admin/ui";
import type { PublicSignatureView } from "@/lib/server/signature-requests";

function shell(message: string, title = "Assinatura digital") {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4">
      <section className="w-full max-w-2xl rounded-surface border border-[var(--color-border-subtle)] bg-white p-5 shadow-[0_18px_50px_rgba(61,82,64,0.08)] sm:p-8">
        <BrandLogo height={44} />
        <h1 className="mt-2 font-serif text-[clamp(1.6rem,5vw,1.875rem)] leading-tight text-teal">{title}</h1>
        <p className="mt-3 text-muted">{message}</p>
      </section>
    </div>
  );
}

export default function SignPage() {
  const params = useParams<{ token: string }>();
  const token = typeof params.token === "string" ? params.token : "";
  const [doc, setDoc] = useState<PublicSignatureView | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "expired" | "signed" | "done">("loading");
  const [signerName, setSignerName] = useState("");
  const [signerCpf, setSignerCpf] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    if (!token) return;
    (async () => {
      try {
        const response = await fetch(`/api/public/sign/${encodeURIComponent(token)}`);
        if (!active) return;
        if (response.status === 404) {
          setState("missing");
          return;
        }
        if (!response.ok) {
          setState("missing");
          return;
        }
        const view = (await response.json()) as PublicSignatureView;
        setDoc(view);
        if (view.signed) setState("signed");
        else if (view.expired) setState("expired");
        else setState("ready");
      } catch {
        if (active) setState("missing");
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/public/sign/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName, signerCpf, guardianName, accepted }),
      });
      if (response.ok) {
        setState("done");
        return;
      }
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error || "Não foi possível registrar o aceite.");
    } catch {
      setError("Não foi possível registrar o aceite.");
    } finally {
      setSaving(false);
    }
  }

  if (state === "loading") {
    return <div className="grid min-h-screen place-items-center bg-paper text-muted">Carregando...</div>;
  }
  if (state === "missing") return shell("Este link não está disponível.");
  if (state === "expired") return shell("Este link expirou. Solicite um novo envio à psicóloga.");
  if (state === "signed") return shell("Este documento já foi assinado.");
  if (state === "done") {
    return shell("Aceite registrado com sucesso. Você pode fechar esta página.", "Assinatura concluída");
  }
  if (!doc) return shell("Este link não está disponível.");

  return (
    <div className="min-h-screen bg-paper px-4 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <BrandLogo height={44} />
        <header>
          <h1 className="font-serif text-2xl text-teal">{doc.title}</h1>
          <p className="mt-2 text-sm text-muted">
            Assinatura eletrônica simples (Lei 14.063/2020), válida entre as partes. Leia o texto abaixo antes de aceitar.
          </p>
        </header>
        <article className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {doc.body}
        </article>
        <form className="grid gap-4 rounded-surface border border-[var(--color-border-subtle)] bg-white p-4" onSubmit={onSubmit}>
          <label className="grid gap-1 text-sm">
            Nome completo
            <input className={fieldClass} value={signerName} onChange={(e) => setSignerName(e.target.value)} required />
          </label>
          <label className="grid gap-1 text-sm">
            CPF
            <input
              className={fieldClass}
              inputMode="numeric"
              value={signerCpf}
              onChange={(e) => setSignerCpf(e.target.value)}
              required
            />
          </label>
          {doc.requiresGuardian ? (
            <label className="grid gap-1 text-sm">
              Nome do responsável legal (se menor)
              <input className={fieldClass} value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
            </label>
          ) : null}
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1" />
            Li e concordo com o documento acima.
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button type="submit" className="btn-primary min-h-11" disabled={saving || !accepted}>
            {saving ? "Registrando..." : "Assinar e aceitar"}
          </button>
        </form>
      </div>
    </div>
  );
}
