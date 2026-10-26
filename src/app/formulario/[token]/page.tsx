"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import { fieldClass } from "@/components/admin/ui";
import type { FormFieldDef } from "@/lib/admin/form-types";

type PublicForm = {
  title: string;
  finalidade: string;
  version: number;
  fields: FormFieldDef[];
  expired: boolean;
  answered: boolean;
};

function shell(message: string) {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4">
      <section className="w-full max-w-lg rounded-surface border border-[var(--color-border-subtle)] bg-white p-5 sm:p-8">
        <BrandLogo height={44} />
        <h1 className="mt-2 font-serif text-2xl text-teal">Formulário</h1>
        <p className="mt-3 text-muted">{message}</p>
      </section>
    </div>
  );
}

export default function PublicFormPage() {
  const params = useParams<{ token: string }>();
  const token = typeof params.token === "string" ? params.token : "";
  const [form, setForm] = useState<PublicForm | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "expired" | "answered" | "sent">("loading");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    if (!token) return;
    (async () => {
      try {
        const response = await fetch(`/api/public/form/${encodeURIComponent(token)}`);
        if (!active) return;
        if (response.status === 404) {
          setState("missing");
          return;
        }
        const view = (await response.json()) as PublicForm;
        setForm(view);
        if (view.answered) setState("answered");
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
      const response = await fetch(`/api/public/form/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (response.ok) {
        setState("sent");
        return;
      }
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error || "Não foi possível enviar.");
    } catch {
      setError("Não foi possível enviar.");
    } finally {
      setSaving(false);
    }
  }

  if (state === "loading") return <div className="grid min-h-screen place-items-center bg-paper text-muted">Carregando...</div>;
  if (state === "missing") return shell("Este link não está disponível.");
  if (state === "expired") return shell("Este link expirou.");
  if (state === "answered" || state === "sent") return shell("Respostas já registradas. Obrigado!");

  if (!form) return shell("Este link não está disponível.");

  return (
    <div className="min-h-screen bg-paper px-4 py-8">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <BrandLogo height={44} />
        <header>
          <h1 className="font-serif text-2xl text-teal">{form.title}</h1>
          <p className="mt-2 text-sm text-muted">{form.finalidade}</p>
          <p className="text-xs text-muted">Versão {form.version} · dados de saúde tratados como prontuário (LGPD).</p>
        </header>
        <form className="grid gap-4" onSubmit={onSubmit}>
          {form.fields.map((field) => (
            <label key={field.id} className="grid gap-1 text-sm">
              {field.label}
              {field.required ? <span className="text-xs text-muted"> (obrigatório)</span> : null}
              {field.type === "textarea" ? (
                <textarea
                  className={fieldClass}
                  rows={4}
                  value={answers[field.id] || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
                  required={field.required}
                />
              ) : field.type === "select" ? (
                <select
                  className={fieldClass}
                  value={answers[field.id] || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
                  required={field.required}
                >
                  <option value="">Selecione</option>
                  {(field.options || []).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  className={fieldClass}
                  type={field.type === "date" ? "date" : "text"}
                  value={answers[field.id] || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
                  required={field.required}
                />
              )}
              {field.helpText ? <span className="text-xs text-muted">{field.helpText}</span> : null}
            </label>
          ))}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button type="submit" className="btn-primary min-h-11" disabled={saving}>
            {saving ? "Enviando..." : "Enviar respostas"}
          </button>
        </form>
      </div>
    </div>
  );
}
