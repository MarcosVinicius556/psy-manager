"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatDate } from "@/lib/admin/format";
import type { PublicFeedbackView } from "@/lib/server/public-session-feedback";
import { PUBLIC_FEEDBACK_COMMENT_MAX } from "@/lib/server/public-session-feedback";
import { fieldClass } from "@/components/admin/ui";
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

export default function FeedbackPage() {
  const params = useParams<{ token: string }>();
  const token = typeof params.token === "string" ? params.token : "";
  const [feedback, setFeedback] = useState<PublicFeedbackView | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "closed" | "expired" | "sent">("loading");
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!token) return;
    (async () => {
      try {
        const response = await fetch(`/api/public/feedback/${encodeURIComponent(token)}`);
        if (!active) return;
        if (response.status === 404) {
          setState("missing");
          return;
        }
        if (!response.ok) {
          setState("missing");
          return;
        }
        const found = (await response.json()) as PublicFeedbackView;
        setFeedback(found);
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

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (stars < 1) {
      setError("Escolha de 1 a 5 estrelas.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/public/feedback/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, comment }),
      });
      if (response.ok) {
        setState("sent");
        return;
      }
      if (response.status === 409 || response.status === 410) {
        setError("Não foi possível enviar. O link pode ter expirado ou já ter sido usado.");
        return;
      }
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error || "Não foi possível enviar. Tente novamente.");
    } catch {
      setError("Não foi possível enviar. O link pode ter expirado ou já ter sido usado.");
    } finally {
      setSaving(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-paper text-muted">Carregando...</div>
    );
  }
  if (state === "missing" || state === "closed") {
    return unavailable("Este link não está mais disponível.");
  }
  if (state === "expired") {
    return unavailable("Este link expirou. O prazo para responder era de 48 horas.");
  }
  if (state === "sent") {
    return (
      <div className="grid min-h-screen place-items-center bg-paper px-4">
        <section className="w-full max-w-lg rounded-md bg-white p-5 shadow-[0_18px_50px_rgba(61,82,64,0.08)] sm:p-8">
          <BrandLogo height={44} />
          <h1 className="mt-2 font-serif text-[clamp(1.6rem,5vw,1.875rem)] leading-tight text-teal">Obrigado pelo retorno</h1>
          <p className="mt-3 text-muted">Sua avaliação foi registrada. Este link não pode ser usado de novo.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <form onSubmit={onSubmit} className="grid w-full max-w-lg gap-5 rounded-md bg-white p-5 shadow-[0_18px_50px_rgba(61,82,64,0.08)] sm:p-8">
        <div>
          <BrandLogo height={44} />
          <h1 className="mt-2 font-serif text-[clamp(1.6rem,5vw,1.875rem)] leading-tight text-teal">Como foi o atendimento?</h1>
          <p className="mt-3 text-muted">
            {feedback?.professionalNome ? `${feedback.professionalNome} · ` : ""}
            {formatDate(feedback?.sessionDate || "")}
            {feedback?.startTime ? ` · ${feedback.startTime}` : ""}
          </p>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Estrelas</p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`}
                onClick={() => setStars(value)}
                className={`grid h-11 w-11 place-items-center rounded-md border text-xl sm:h-12 sm:w-12 ${
                  value <= stars ? "border-teal bg-teal text-white" : "border-leaf bg-white text-teal"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <label className="grid gap-2 text-sm font-medium">
          Comentário
          <textarea
            className={`${fieldClass} min-h-28`}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={PUBLIC_FEEDBACK_COMMENT_MAX}
            placeholder="Opcional"
          />
        </label>
        {error && <p className="text-sm text-accent">{error}</p>}
        <button className="btn-primary w-full sm:w-auto" disabled={saving}>
          {saving ? "Enviando..." : "Enviar avaliação"}
        </button>
      </form>
    </div>
  );
}
