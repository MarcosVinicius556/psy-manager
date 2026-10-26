"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { patientFetch } from "@/lib/patient/api";

type Scale = {
  id: string;
  nome: string;
  finalidade: string;
  campos: { id: string; label: string; options?: string[] }[];
  series: { submittedAt: string; pontuacao: number; faixa: string }[];
};

export default function PatientScalesPage() {
  const [scales, setScales] = useState<Scale[]>([]);
  const [note, setNote] = useState("");
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    void patientFetch("/api/patient/scales").then((data) => {
      setScales(data.scales as Scale[]);
      setNote(data.satepsiNote as string);
    });
  }, []);

  async function submit(templateId: string) {
    try {
      const res = await patientFetch("/api/patient/scales/submit", {
        method: "POST",
        body: JSON.stringify({ templateId, respostas: answers[templateId] || {} }),
      });
      toast.success(`Pontuação: ${res.pontuacao} (${res.faixa})`);
      const data = await patientFetch("/api/patient/scales");
      setScales(data.scales as Scale[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Resposta incompleta.");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium text-teal">Escalas</h1>
      <p className="text-xs text-muted">{note}</p>
      {scales.map((scale) => (
        <section key={scale.id} className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4">
          <h2 className="font-medium text-teal">{scale.nome}</h2>
          <p className="mb-3 text-sm text-muted">{scale.finalidade}</p>
          {scale.series.length > 0 && (
            <p className="mb-3 text-sm">
              Última: {scale.series[scale.series.length - 1].pontuacao} ({scale.series[scale.series.length - 1].faixa}) em{" "}
              {scale.series[scale.series.length - 1].submittedAt.slice(0, 10)}
            </p>
          )}
          <div className="space-y-3 text-sm">
            {scale.campos.map((field) => (
              <label key={field.id} className="block">
                {field.label}
                <select
                  className="field mt-1 w-full"
                  value={answers[scale.id]?.[field.id] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [scale.id]: { ...(prev[scale.id] || {}), [field.id]: e.target.value },
                    }))
                  }
                >
                  <option value="">—</option>
                  {(field.options || ["0", "1", "2", "3"]).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <button type="button" className="btn-primary mt-4" onClick={() => void submit(scale.id)}>Enviar respostas</button>
          {scale.series.length > 1 && (
            <p className="mt-3 text-xs text-muted">
              Evolução: {scale.series.map((p) => p.pontuacao).join(" → ")}
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
