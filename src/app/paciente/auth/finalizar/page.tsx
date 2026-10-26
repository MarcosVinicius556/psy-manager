"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { storedPatientEmail, usePatientAuth } from "@/lib/patient/auth-context";

export default function PatientAuthFinishPage() {
  const router = useRouter();
  const { completeMagicLink } = usePatientAuth();
  const [email, setEmail] = useState(storedPatientEmail());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!email) return;
    setBusy(true);
    void completeMagicLink(email, window.location.href)
      .then(() => router.replace("/paciente"))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Link inválido ou expirado.");
        setBusy(false);
      });
  }, [completeMagicLink, email, router]);

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-sm">
      <h1 className="mb-2 text-xl font-medium text-teal">Confirmar e-mail</h1>
      {busy && !error && <p className="text-muted">Validando seu acesso…</p>}
      {!email && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const value = new FormData(form).get("email");
            if (typeof value === "string") setEmail(value);
          }}
        >
          <p className="text-muted">Informe o mesmo e-mail usado para pedir o link.</p>
          <input className="field w-full" name="email" type="email" required />
          <button type="submit" className="btn-primary w-full">Continuar</button>
        </form>
      )}
      {error && <p className="text-accent">{error}</p>}
    </div>
  );
}
