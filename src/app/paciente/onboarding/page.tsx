"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { patientFetch } from "@/lib/patient/api";
import { usePatientAuth } from "@/lib/patient/auth-context";

const COUNTRY_CODES = [
  { value: "+55", label: "Brasil (+55)" },
  { value: "+351", label: "Portugal (+351)" },
  { value: "+1", label: "EUA/Canadá (+1)" },
];

export default function PatientOnboardingPage() {
  const router = useRouter();
  const { profile, refreshProfile } = usePatientAuth();
  const [nome, setNome] = useState(profile?.patientNome || "");
  const [telefonePais, setTelefonePais] = useState("+55");
  const [telefone, setTelefone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await patientFetch("/api/patient/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ nome, telefone, telefonePais }),
      });
      await refreshProfile();
      router.replace("/paciente/conexoes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 py-6">
      <h1 className="text-2xl font-medium text-teal">Falta só um passo</h1>
      <p className="text-sm text-muted">Confirme seu nome e telefone para continuar no portal.</p>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-3 rounded-surface border border-[var(--color-border-subtle)] bg-white p-4">
        <label className="block text-sm">
          Nome completo
          <input className="field mt-1 w-full" required value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
        </label>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,9rem)_1fr]">
          <label className="block text-sm">
            País
            <select className="field mt-1 w-full" value={telefonePais} onChange={(e) => setTelefonePais(e.target.value)}>
              {COUNTRY_CODES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Telefone (somente números)
            <input className="field mt-1 w-full" required inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="11999998888" />
          </label>
        </div>
        {error && <p className="text-sm text-accent">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? "Salvando…" : "Salvar e continuar"}
        </button>
      </form>
    </div>
  );
}
