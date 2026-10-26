"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { Card, Field, fieldClass } from "@/components/admin/ui";
import { useClinic } from "@/lib/admin/clinic-context";
import { BOOKING_DEFAULTS } from "@/lib/booking/config";
import type { BookingProfile } from "@/lib/booking/types";
import Select from "@/components/admin/Select";

export default function BookingPublicSettingsCard() {
  const { locations } = useClinic();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [slug, setSlug] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(String(BOOKING_DEFAULTS.durationMinutes));
  const [bufferMinutes, setBufferMinutes] = useState(String(BOOKING_DEFAULTS.bufferMinutes));
  const [advanceDays, setAdvanceDays] = useState(String(BOOKING_DEFAULTS.advanceDays));
  const [minNoticeHours, setMinNoticeHours] = useState(String(BOOKING_DEFAULTS.minNoticeHours));
  const [modalitiesOnline, setModalitiesOnline] = useState(true);
  const [modalitiesPresencial, setModalitiesPresencial] = useState(true);
  const [acceptNewPatients, setAcceptNewPatients] = useState(true);
  const [locationId, setLocationId] = useState("");
  const [publicPath, setPublicPath] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/booking/profile");
        if (!response.ok) throw new Error("load");
        const data = (await response.json()) as { profile: BookingProfile | null; publicPath: string | null };
        if (!active) return;
        const profile = data.profile;
        if (profile) {
          setEnabled(profile.enabled);
          setSlug(profile.slug);
          setDurationMinutes(String(profile.durationMinutes));
          setBufferMinutes(String(profile.bufferMinutes));
          setAdvanceDays(String(profile.advanceDays));
          setMinNoticeHours(String(profile.minNoticeHours));
          setModalitiesOnline(profile.modalities.includes("online"));
          setModalitiesPresencial(profile.modalities.includes("presencial"));
          setAcceptNewPatients(profile.acceptNewPatients);
          setLocationId(profile.locationId || "");
        }
        setPublicPath(data.publicPath);
      } catch {
        if (active) toast.error("Não foi possível carregar o link de agendamento.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const modalities: ("online" | "presencial")[] = [];
      if (modalitiesOnline) modalities.push("online");
      if (modalitiesPresencial) modalities.push("presencial");
      if (!modalities.length) {
        toast.error("Escolha ao menos uma modalidade.");
        return;
      }
      const response = await fetch("/api/booking/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          slug,
          durationMinutes: Number(durationMinutes),
          bufferMinutes: Number(bufferMinutes),
          advanceDays: Number(advanceDays),
          minNoticeHours: Number(minNoticeHours),
          modalities,
          acceptNewPatients,
          locationId: locationId || null,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; publicPath?: string | null };
      if (!response.ok) {
        toast.error(payload?.error || "Não foi possível salvar.");
        return;
      }
      setPublicPath(payload.publicPath ?? null);
      toast.success("Link de agendamento atualizado.");
    } catch {
      toast.error("Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <Card>
      <h2 className="text-lg font-semibold text-teal">Link público de agendamento</h2>
      <p className="mt-2 text-sm text-muted">
        Pacientes pedem horários sem login. Você aprova cada pedido na agenda antes de criar a sessão.
      </p>
      {loading ? (
        <p className="mt-4 text-sm text-muted">Carregando...</p>
      ) : (
        <form onSubmit={onSave} className="mt-4 flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
            Ativar link público
          </label>
          <Field label="Endereço do link (slug)">
            <input
              className={fieldClass}
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="marina-costa"
            />
          </Field>
          {publicPath ? (
            <p className="text-sm text-muted">
              URL:{" "}
              <Link href={publicPath} className="font-semibold text-teal underline" target="_blank">
                {origin}
                {publicPath}
              </Link>
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Duração da sessão (min)">
              <input
                className={fieldClass}
                type="number"
                min={5}
                max={480}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
              />
            </Field>
            <Field label="Intervalo entre sessões (min)">
              <input
                className={fieldClass}
                type="number"
                min={0}
                max={120}
                value={bufferMinutes}
                onChange={(event) => setBufferMinutes(event.target.value)}
              />
            </Field>
            <Field label="Janela de agendamento (dias)">
              <input
                className={fieldClass}
                type="number"
                min={1}
                max={60}
                value={advanceDays}
                onChange={(event) => setAdvanceDays(event.target.value)}
              />
            </Field>
            <Field label="Antecedência mínima (horas)">
              <input
                className={fieldClass}
                type="number"
                min={0}
                max={168}
                value={minNoticeHours}
                onChange={(event) => setMinNoticeHours(event.target.value)}
              />
            </Field>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-semibold text-teal">Modalidades</span>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={modalitiesOnline} onChange={(event) => setModalitiesOnline(event.target.checked)} />
              Online
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={modalitiesPresencial}
                onChange={(event) => setModalitiesPresencial(event.target.checked)}
              />
              Presencial
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={acceptNewPatients}
              onChange={(event) => setAcceptNewPatients(event.target.checked)}
            />
            Aceitar pacientes novos pelo link
          </label>
          {modalitiesPresencial ? (
            <Field label="Local padrão (presencial)">
              <Select
                value={locationId}
                onChange={setLocationId}
                options={[
                  { value: "", label: "Nenhum" },
                  ...locations.map((loc) => ({ value: loc.id, label: loc.nome })),
                ]}
              />
            </Field>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary min-h-11 w-fit rounded-control px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar link de agendamento"}
          </button>
        </form>
      )}
    </Card>
  );
}
