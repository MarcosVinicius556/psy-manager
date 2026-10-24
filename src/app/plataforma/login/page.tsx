"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { fieldClass } from "@/components/admin/ui";
import { useAuth } from "@/lib/admin/auth-context";
import { getUserRole } from "@/lib/admin/collections";

export default function PlatformLoginPage() {
  const { signIn, logout, configured } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      await signIn(email, password);
      const { getFirebaseAuth } = await import("@/lib/admin/firebase");
      const uid = getFirebaseAuth().currentUser?.uid;
      const role = uid ? await getUserRole(uid) : "psicologo";
      if (role !== "super_admin") {
        await logout();
        setMessage("Esta área é exclusiva do proprietário da plataforma.");
        return;
      }
      router.replace("/plataforma");
    } catch (error) {
      const code = error instanceof FirebaseError ? error.code : "";
      setMessage(code === "auth/too-many-requests" ? "Muitas tentativas. Aguarde e tente de novo." : "Não foi possível entrar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-md bg-white p-8 shadow-[0_18px_50px_rgba(61,82,64,0.12)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Proprietário</p>
        <h1 className="mt-2 font-serif text-4xl font-medium text-teal">Plataforma</h1>
        <p className="mt-2 text-muted">Indicadores, contas e comunicação. Prontuários não aparecem aqui.</p>
        {!configured && <p className="mt-4 rounded-md bg-[#f6e6df] px-4 py-3 text-sm text-accent">Configure o Firebase para entrar.</p>}
        <label className="mt-6 block text-sm font-medium" htmlFor="email">E-mail</label>
        <input id="email" type="email" required className={`${fieldClass} mt-1`} value={email} onChange={(event) => setEmail(event.target.value)} />
        <label className="mt-4 block text-sm font-medium" htmlFor="senha">Senha</label>
        <input id="senha" type="password" required className={`${fieldClass} mt-1`} value={password} onChange={(event) => setPassword(event.target.value)} />
        {message && <p className="mt-3 text-sm text-accent" role="alert">{message}</p>}
        <button className="btn-primary mt-6 w-full" disabled={submitting || !configured}>{submitting ? "Entrando..." : "Entrar"}</button>
      </form>
    </div>
  );
}
