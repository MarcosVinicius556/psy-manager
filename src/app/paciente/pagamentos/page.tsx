"use client";

import { useEffect, useState } from "react";
import { patientFetch } from "@/lib/patient/api";

type Row = {
  id: string;
  descricao: string;
  dueDate: string;
  valorRestante: number;
  pix: { code?: string; error?: string };
};

export default function PatientPaymentsPage() {
  const [items, setItems] = useState<Row[]>([]);

  useEffect(() => {
    void patientFetch("/api/patient/payments").then((data) => setItems(data.items as Row[]));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-medium text-teal">Pagamentos</h1>
      <p className="text-sm text-muted">Pix copia e cola. A confirmação do pagamento é feita pelo profissional após o comprovante.</p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-surface border border-[var(--color-border-subtle)] bg-white p-4 text-sm">
            <p className="font-medium">{item.descricao}</p>
            <p className="text-muted">Vence {item.dueDate} · R$ {item.valorRestante.toFixed(2)}</p>
            {item.pix.code ? (
              <textarea className="field mt-2 w-full text-xs" readOnly rows={3} value={item.pix.code} />
            ) : (
              <p className="mt-2 text-accent text-xs">{item.pix.error || "Pix indisponível"}</p>
            )}
          </li>
        ))}
        {items.length === 0 && <p className="text-sm text-muted">Nenhuma cobrança em aberto.</p>}
      </ul>
    </div>
  );
}
