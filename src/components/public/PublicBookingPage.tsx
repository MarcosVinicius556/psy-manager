"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { fieldClass } from "@/components/admin/ui";
import { formatDate } from "@/lib/admin/format";
import type { Modality } from "@/lib/admin/types";
import type { BookingSlot, PublicBookingView } from "@/lib/booking/types";

type Props = {
  slug: string;
  initial: PublicBookingView | null;
  unavailable?: boolean;
};

export default function PublicBookingPage({ slug, initial, unavailable }: Props) {
  const [view, setView] = useState<PublicBookingView | null>(initial);
  const [selected, setSelected] = useState<BookingSlot | null>(null);
  const [modality, setModality] = useState<Modality>("online");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial?.modalities?.length === 1) {
      setModality(initial.modalities[0]);
    }
  }, [initial]);

  const slotsByDate = useMemo(() => {
    const map = new Map<string, BookingSlot[]>();
    for (const slot of view?.slots || []) {
      const list = map.get(slot.date) || [];
      list.push(slot);
      map.set(slot.date, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [view?.slots]);

  async function refreshSlots() {
    try {
      const response = await fetch(`/api/public/booking/${encodeURIComponent(slug)}`);
      if (!response.ok) return;
      const data = (await response.json()) as PublicBookingView;
      setView(data);
    } catch {
      /* ignore */
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) {
      setError("Escolha um horário.");
      return;
    }
    if (!consent) {
      setError("Aceite o aviso de privacidade para continuar.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/public/booking/${encodeURIComponent(slug)}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          modality,
          date: selected.date,
          startTime: selected.startTime,
          endTime: selected.endTime,
          consent,
          company,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error || "Não foi possível enviar o pedido.");
        if (response.status === 409) void refreshSlots();
        return;
      }
      setSent(true);
    } catch {
      setError("Não foi possível enviar o pedido.");
    } finally {
      setSaving(false);
    }
  }

  if (unavailable || !view) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper px-4">
        <section className="w-full max-w-lg rounded-surface bg-white p-5 shadow-[0_18px_50px_rgba(61,82,64,0.08)] sm:p-8">
          <BrandLogo height={44} />
          <h1 className="mt-2 font-serif text-[clamp(1.6rem,5vw,1.875rem)] leading-tight text-teal">Link indisponível</h1>
          <p className="mt-3 text-muted">Este link de agendamento não está ativo no momento.</p>
        </section>
      </div>
    );
  }

  if (!view.enabled) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper px-4">
        <section className="w-full max-w-lg rounded-surface bg-white p-5 shadow-[0_18px_50px_rgba(61,82,64,0.08)] sm:p-8">
          <BrandLogo height={44} />
          <h1 className="mt-2 font-serif text-[clamp(1.6rem,5vw,1.875rem)] leading-tight text-teal">Agendamento pausado</h1>
          <p className="mt-3 text-muted">
            {view.professionalName} não está aceitando pedidos pelo link neste momento.
          </p>
        </section>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper px-4">
        <section className="w-full max-w-lg rounded-surface bg-white p-5 shadow-[0_18px_50px_rgba(61,82,64,0.08)] sm:p-8">
          <BrandLogo height={44} />
          <h1 className="mt-2 font-serif text-[clamp(1.6rem,5vw,1.875rem)] leading-tight text-teal">Pedido enviado</h1>
          <p className="mt-3 text-muted">
            Recebemos sua solicitação. {view.professionalName} vai analisar e você receberá um e-mail quando o horário for
            confirmado.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper px-4 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-5 sm:p-6">
          <BrandLogo height={40} />
          <h1 className="mt-3 font-serif text-2xl text-teal">Agendar com {view.professionalName}</h1>
          <p className="mt-2 text-sm text-muted">
            Escolha um horário livre. A confirmação depende da aprovação do profissional (sessões de {view.durationMinutes}{" "}
            min).
          </p>
        </header>

        <section className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-teal">Horários disponíveis</h2>
          {slotsByDate.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Não há horários livres nos próximos dias. Tente novamente mais tarde.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              {slotsByDate.map(([date, slots]) => (
                <div key={date}>
                  <p className="text-sm font-semibold text-teal">{formatDate(date)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {slots.map((slot) => {
                      const active =
                        selected?.date === slot.date && selected.startTime === slot.startTime;
                      return (
                        <button
                          key={`${slot.date}-${slot.startTime}`}
                          type="button"
                          className={`min-h-11 rounded-control border px-3 text-sm transition ${
                            active
                              ? "border-teal bg-teal text-white"
                              : "border-[var(--color-border-subtle)] bg-white text-teal hover:border-teal hover:bg-transparent"
                          }`}
                          onClick={() => setSelected(slot)}
                        >
                          {slot.startTime}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <form
          onSubmit={onSubmit}
          className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-5 sm:p-6"
        >
          <h2 className="text-lg font-semibold text-teal">Seus dados</h2>
          <div className="mt-4 flex flex-col gap-3">
            {view.modalities.length > 1 ? (
              <label className="text-sm text-muted">
                Modalidade
                <select
                  className={`${fieldClass} mt-1`}
                  value={modality}
                  onChange={(event) => setModality(event.target.value === "presencial" ? "presencial" : "online")}
                >
                  {view.modalities.includes("online") ? <option value="online">Online</option> : null}
                  {view.modalities.includes("presencial") ? <option value="presencial">Presencial</option> : null}
                </select>
              </label>
            ) : null}
            <label className="text-sm text-muted">
              Nome completo
              <input
                className={`${fieldClass} mt-1`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoComplete="name"
              />
            </label>
            <label className="text-sm text-muted">
              E-mail
              <input
                className={`${fieldClass} mt-1`}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label className="text-sm text-muted">
              Telefone
              <input
                className={`${fieldClass} mt-1`}
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                autoComplete="tel"
              />
            </label>
            <label className="flex items-start gap-2 text-sm text-muted">
              <input
                type="checkbox"
                className="mt-1"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <span>
                Li o{" "}
                <Link href="/privacidade" className="font-semibold text-teal underline" target="_blank">
                  aviso de privacidade
                </Link>{" "}
                e autorizo o uso dos meus dados de contato para organizar este agendamento (LGPD).
              </span>
            </label>
            <input
              type="text"
              name="company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
            />
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <button
              type="submit"
              disabled={saving || !selected}
              className="btn-primary min-h-11 rounded-control px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Enviando..." : "Solicitar horário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
