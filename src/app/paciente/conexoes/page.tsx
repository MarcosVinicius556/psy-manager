"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PatientAppearanceSettings } from "@/components/patient/PatientPortalTheme";
import { patientFetch } from "@/lib/patient/api";
import { usePatientAuth } from "@/lib/patient/auth-context";

type Connection = {
  id: string;
  status: string;
  isActive: boolean;
  profissionalNome: string;
  profissionalEmail: string;
  patientRecordNome: string;
  lastActivatedAt: string;
};

function ConexoesInner() {
  const { signOutPatient, refreshProfile, profile } = usePatientAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [code, setCode] = useState(searchParams.get("codigo") || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await patientFetch("/api/patient/connections");
      setConnections(data.connections as Connection[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function redeem() {
    setMessage("");
    try {
      await patientFetch("/api/patient/connections/redeem", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setCode("");
      await load();
      await refreshProfile();
      setMessage("Código ativado com sucesso.");
      router.replace("/paciente");
    } catch {
      setMessage("Não foi possível ativar este código. Verifique com seu psicólogo(a).");
    }
  }

  async function patchConnection(id: string, action: "ativar" | "desativar") {
    await patientFetch(`/api/patient/connections/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    });
    await load();
    await refreshProfile();
  }

  async function disconnect(id: string) {
    if (!window.confirm("Desconectar este vínculo? Você precisará de um novo código para voltar.")) return;
    await patientFetch(`/api/patient/connections/${id}`, { method: "DELETE" });
    await load();
    await refreshProfile();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-teal">Minhas conexões</h1>
        <p className="text-sm text-muted">Gerencie os espaços vinculados aos seus psicólogos(as).</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : connections.length === 0 ? (
        <p className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4 text-sm text-muted">
          Você ainda não tem conexões ativas. Peça um código de vínculo ao seu psicólogo(a) e cole abaixo.
        </p>
      ) : (
        <ul className="space-y-3">
          {connections.map((conn) => (
            <li key={conn.id} className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4 text-sm">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-teal">{conn.profissionalNome}</p>
                  <p className="text-muted">{conn.profissionalEmail}</p>
                  <p className="mt-1 text-xs text-muted">Prontuário: {conn.patientRecordNome}</p>
                </div>
                <span className="rounded-control bg-paper px-2 py-1 text-xs">
                  {conn.isActive ? "Conexão atual" : conn.status === "desativada" ? "Desativada" : conn.status}
                </span>
              </div>
              <p className="mb-3 text-xs text-muted">Última ativação: {conn.lastActivatedAt?.slice(0, 10) || "—"}</p>
              <div className="flex flex-wrap gap-2">
                {!conn.isActive && (
                  <button type="button" className="btn-row" onClick={() => void patchConnection(conn.id, "ativar")}>
                    Tornar conexão atual
                  </button>
                )}
                {conn.isActive && conn.status === "ativa" && (
                  <button type="button" className="btn-text" onClick={() => void patchConnection(conn.id, "desativar")}>
                    Desativar
                  </button>
                )}
                <button type="button" className="btn-text text-accent" onClick={() => void disconnect(conn.id)}>
                  Desconectar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {profile?.active && profile.profissionalNome && (
        <section className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4 text-sm">
          <h2 className="mb-1 font-medium text-teal">Espaço vinculado</h2>
          <p className="text-muted">Agora você está no espaço de <strong>{profile.profissionalNome}</strong>.</p>
        </section>
      )}

      <section className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4">
        <h2 className="mb-2 font-medium text-teal">Conectar nova psicóloga</h2>
        <p className="mb-3 text-sm text-muted">Cole o código enviado pelo consultório.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="field w-full flex-1 uppercase"
            placeholder="ABCD-1234"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button type="button" className="btn-primary sm:shrink-0" onClick={() => void redeem()}>
            Ativar código
          </button>
        </div>
        {message && <p className="mt-2 text-sm text-muted">{message}</p>}
      </section>

      <PatientAppearanceSettings />

      <button type="button" className="btn-text text-accent" onClick={() => void signOutPatient()}>
        Sair
      </button>
    </div>
  );
}

export default function PatientConexoesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando…</p>}>
      <ConexoesInner />
    </Suspense>
  );
}
