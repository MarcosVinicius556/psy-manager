"use client";

import { useEffect, useState } from "react";
import { patientFetch } from "@/lib/patient/api";

export default function PatientMuralPage() {
  const [items, setItems] = useState<{ id: string; texto: string; createdAt: string }[]>([]);

  useEffect(() => {
    void patientFetch("/api/patient/mural").then((data) => setItems(data.items as typeof items));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-medium text-teal">Mural</h1>
      <p className="text-sm text-muted">Mensagens do seu psicólogo(a) entre as sessões.</p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4 text-sm">
            <p>{item.texto}</p>
            <p className="mt-2 text-xs text-muted">{item.createdAt.slice(0, 16).replace("T", " ")}</p>
          </li>
        ))}
        {items.length === 0 && <p className="text-sm text-muted">Nenhuma mensagem ainda.</p>}
      </ul>
    </div>
  );
}
