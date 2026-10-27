"use client";

import Link from "next/link";
import PatientPushCard from "@/components/patient/PatientPushCard";
import { usePatientAuth } from "@/lib/patient/auth-context";
import { patientFetch } from "@/lib/patient/api";

export default function PatientSettingsPage() {
  const { signOutPatient } = usePatientAuth();

  async function deleteAccount() {
    if (!window.confirm("Excluir sua conta do portal? Isso desvincula todos os espaços e remove seus dados de acesso (LGPD). O prontuário do profissional permanece no consultório.")) return;
    await patientFetch("/api/patient/account", { method: "DELETE" });
    await signOutPatient();
    window.location.href = "/paciente/login";
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium text-teal">Configurações</h1>
      <section className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4">
        <h2 className="mb-2 font-medium">Conta e conexões</h2>
        <Link href="/paciente/conexoes" className="btn-text block">Minhas conexões e aparência</Link>
      </section>
      <section className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4">
        <h2 className="mb-2 font-medium">Notificações</h2>
        <PatientPushCard />
      </section>
      <section className="space-y-2 text-sm">
        <Link href="/paciente/pagamentos" className="btn-text block">Pagamentos e Pix</Link>
        <Link href="/paciente/documentos" className="btn-text block">Documentos e recibos</Link>
        <Link href="/paciente/mural" className="btn-text block">Mural</Link>
      </section>
      <button type="button" className="btn-text text-accent" onClick={() => void signOutPatient()}>Sair</button>
      <button type="button" className="btn-text text-accent" onClick={() => void deleteAccount()}>Excluir minha conta do portal</button>
    </div>
  );
}
