"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatDate } from "@/lib/admin/format";
import type { PublicSessionConfirmationView } from "@/lib/server/session-confirmation";
import BrandLogo from "@/components/BrandLogo";

function unavailable(message: string) {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4">
      <section className="w-full max-w-lg rounded-md bg-white p-5 shadow-[0_18px_50px_rgba(61,82,64,0.08)] sm:p-8">
        <BrandLogo height={44} />
        <h1 className="mt-2 font-serif text-[clamp(1.6rem,5vw,1.875rem)] leading-tight text-teal">Link indisponível</h1>
        <p className="mt-3 text-muted">{message}</p>
      </section>
    </div>
  );
}

export default function ConfirmarSessaoPage() {
  const params = useParams<{ token: string }>();
  const token = typeof params.token === "string" ? params.token : "";
  const [view, setView] = useState<PublicSessionConfirmationView | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "closed" | "expired" | "done">("loading");
  const [doneAction, setDoneAction] = useState<"confirmar" | "remarcar" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!token) return;
    (async () => {
      try {
        const response = await fetch(`/api/public/confirm/${encodeURIComponent(token)}`);
        if (!active) return;
        if (response.status === 404) {
          setState("missing");
          return;
        }
        if (!response.ok) {
          setState("missing");
          return;
        }
        const found = (await response.json()) as PublicSessionConfirmationView;
        setView(found);
        if (found.answered) setState("closed");
        else if (found.expired) setState("expired");
        else setState("ready");
      } catch {
        if (active) setState("missing");
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  async function submit(action: "confirmar" | "remarcar") {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/public/confirm/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (response.ok) {
        setDoneAction(action);
        setState("done");
        return;
      }
      if (response.status === 409 || response.status === 410) {
        const data = (await response.json()) as { error?: string };
        setError(data.error || "Este link não está mais disponível.");
        setState("closed");
        return;
      }
      const data = (await response.json()) as { error?: string };
      setError(data.error || "Não foi possível registrar sua resposta.");
    } catch {
      setError("Não foi possível registrar sua resposta. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-paper text-muted">
        Carregando...
      </div>
    );
  }
  if (state === "missing") return unavailable("Este link não existe ou já foi removido.");
  if (state === "expired") return unavailable("Este link expirou. Entre em contato com o consultório se precisar confirmar o horário.");
  if (state === "closed" && view) {
    return unavailable(
      view.status === "confirmada"
        ? "Esta sessão já foi confirmada."
        : view.status === "remarcar"
          ? "Já registramos o pedido de remarcação para esta sessão."
          : "Este link já foi utilizado."
    );
  }
  if (state === "done") {
    return (
      <div className="grid min-h-screen place-items-center bg-paper px-4">
        <section className="w-full max-w-lg rounded-md bg-white p-5 shadow-[0_18px_50px_rgba(61,82,64,0.08)] sm:p-8">
          <BrandLogo height={44} />
          <h1 className="mt-2 font-serif text-[clamp(1.6rem,5vw,1.875rem)] leading-tight text-teal">
            {doneAction === "remarcar" ? "Pedido registrado" : "Presença confirmada"}
          </h1>
          <p className="mt-3 text-muted">
            {doneAction === "remarcar"
              ? "O consultório foi avisado. Aguarde o contato para remarcar."
              : "Obrigado! Sua presença na sessão foi confirmada."}
          </p>
        </section>
      </div>
    );
  }

  if (!view) return unavailable("Não foi possível carregar os dados.");

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4 py-8">
      <section className="w-full max-w-lg rounded-md bg-white p-5 shadow-[0_18px_50px_rgba(61,82,64,0.08)] sm:p-8">
        <BrandLogo height={44} />
        <h1 className="mt-2 font-serif text-[clamp(1.6rem,5vw,1.875rem)] leading-tight text-teal">Confirmar sessão</h1>
        <p className="mt-2 text-muted">
          Sessão com <strong className="text-ink">{view.professionalNome || "profissional"}</strong>
        </p>
        <dl className="mt-4 grid gap-2 text-sm text-ink">
          <div className="flex justify-between gap-3 border-b border-[var(--color-border-subtle)] py-2">
            <dt className="text-muted">Data</dt>
            <dd>{view.sessionDate ? formatDate(view.sessionDate) : "—"}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-[var(--color-border-subtle)] py-2">
            <dt className="text-muted">Horário</dt>
            <dd>{view.startTime || "—"}</dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-[var(--color-border-subtle)] py-2">
            <dt className="text-muted">Local</dt>
            <dd className="max-w-[60%] text-right">{view.placeLabel || (view.modality === "online" ? "Online" : "Presencial")}</dd>
          </div>
        </dl>
        {error ? <p className="mt-4 text-sm text-accent">{error}</p> : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" className="btn-primary min-h-11 flex-1" disabled={saving} onClick={() => void submit("confirmar")}>
            {saving ? "Enviando..." : "Confirmar presença"}
          </button>
          <button type="button" className="btn-text min-h-11 flex-1" disabled={saving} onClick={() => void submit("remarcar")}>
            Preciso remarcar
          </button>
        </div>
        <p className="mt-4 text-xs text-muted">Sem conteúdo clínico nesta página. Em caso de urgência, contate o consultório pelos canais habituais.</p>
      </section>
    </div>
  );
}
