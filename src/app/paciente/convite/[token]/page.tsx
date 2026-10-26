"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/admin/firebase";
import { usePatientAuth } from "@/lib/patient/auth-context";

export default function PatientInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { user, sendMagicLink } = usePatientAuth();
  const [info, setInfo] = useState<{ patientNome: string; email: string } | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/public/patient-invite/${params.token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.reason || "convite_invalido");
        setInfo({ patientNome: data.patientNome, email: data.email });
        if (data.email) setEmail(data.email);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Convite inválido"));
  }, [params.token]);

  async function acceptWithSession() {
    const auth = getFirebaseAuth();
    const current = auth.currentUser || user;
    if (!current) {
      await sendMagicLink(email);
      return;
    }
    const idToken = await current.getIdToken();
    const res = await fetch(`/api/public/patient-invite/${params.token}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.reason || "falha");
      return;
    }
    router.replace("/paciente");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 text-2xl font-medium text-teal">Convite do portal</h1>
      {info ? (
        <>
          <p className="mb-4 text-sm text-muted">
            Olá, <strong>{info.patientNome}</strong>. Confirme o e-mail para acessar o portal do paciente.
          </p>
          <input className="field mb-3 w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="button" className="btn-primary w-full" onClick={() => void acceptWithSession()}>
            {user ? "Aceitar convite" : "Receber link por e-mail"}
          </button>
        </>
      ) : (
        <p className="text-sm text-muted">{error || "Carregando convite…"}</p>
      )}
      {error && info && <p className="mt-3 text-sm text-accent">{error}</p>}
    </div>
  );
}
